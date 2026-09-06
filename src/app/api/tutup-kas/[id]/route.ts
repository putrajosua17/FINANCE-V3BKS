import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { assertPeriodOpen } from "@/lib/period-lock";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
 const user=await getSession(); if(!user || !["owner","finance"].includes(user.role)) return NextResponse.json({error:"Hanya finance/owner."},{status:403});
 const {id}=await params;
 try { await prisma.$transaction(async db=>{
  await db.$executeRaw`SELECT pg_advisory_xact_lock(7300601)`;
  const c=await db.cashClosing.findUnique({where:{id}}); if(!c) throw new Error("Tidak ditemukan");
  await assertPeriodOpen(db,c.tanggal,c.businessUnitId);
  await db.cashClosing.update({where:{id},data:{status:Math.abs(c.selisih)>0.5?"selisih_belum_terjelaskan":"disetujui",disetujuiOlehId:user.id}});
  await db.auditLog.create({data:{userId:user.id,userName:user.nama,aksi:"review",entitas:"cashclosing",detail:`${id}: selisih ${c.selisih}; tidak membuat jurnal penyesuaian otomatis.`}});
 });return NextResponse.json({ok:true}); } catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Gagal"},{status:400});}
}
