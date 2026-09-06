import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isFinance } from "@/lib/access";
import { assertPeriodOpen } from "@/lib/period-lock";
export async function POST(req:Request){const user=await getSession();if(!user||!isFinance(user.role))return NextResponse.json({error:"Hanya finance/owner."},{status:403});
 try{const b=await req.json();await prisma.$transaction(async db=>{
 await db.$executeRaw`SELECT pg_advisory_xact_lock(7300601)`;
 const tx=await db.transaction.findUnique({where:{id:b.transactionId}}),booking=await db.booking.findUnique({where:{id:b.bookingId}});
 if(!tx||tx.deletedAt||tx.tipe!=="income"||!booking)throw new Error("Pilih pembayaran dan booking yang valid.");
 await assertPeriodOpen(db,tx.tanggal,tx.businessUnitId);
 if(tx.bookingId&&tx.bookingId!==booking.id)throw new Error("Pembayaran sudah terhubung ke booking lain.");
 await db.transaction.update({where:{id:tx.id},data:{bookingId:booking.id}});
 const total=await db.transaction.aggregate({where:{bookingId:booking.id,deletedAt:null},_sum:{jumlah:true}});
 const paid=total._sum.jumlah||0;
 await db.booking.update({where:{id:booking.id},data:{dp:paid,sisaPelunasan:booking.harga>0?Math.max(0,booking.harga-paid):0,status:booking.harga>0&&paid>=booking.harga?"lunas":"dp"}});
 await db.auditLog.create({data:{userId:user.id,userName:user.nama,aksi:"link",entitas:"payment",detail:`${tx.id} → ${booking.id}; tidak membuat penerimaan baru.`}});
 });return NextResponse.json({ok:true});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Gagal"},{status:400});}}
