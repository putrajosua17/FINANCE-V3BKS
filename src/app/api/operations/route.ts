import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isFinance } from "@/lib/access";
import { checkReference } from "@/lib/operation-access";
export async function GET() {
 const user=await getSession(); if(!user)return NextResponse.json({error:"Masuk kembali"},{status:401});
 const finance=isFinance(user.role);
 const [items,transactions,batches,evidence]=await Promise.all([
  prisma.operationNote.findMany({where:finance?{}:{authorId:user.id},orderBy:{createdAt:"desc"},take:100}),
  prisma.transaction.findMany({where:{deletedAt:null,...(finance?{}:{createdById:user.id})},select:{id:true,tanggal:true,namaEntitas:true,jumlah:true,category:{select:{nama:true}}},orderBy:{tanggal:"desc"},take:300}),
  prisma.importBatch.findMany({where:finance?{}:{uploadedById:user.id},select:{id:true,fileName:true},orderBy:{createdAt:"desc"},take:100}),
  prisma.evidence.findMany({where:finance?{}:{uploadedById:user.id},select:{id:true,name:true,transactionId:true,importBatchId:true},orderBy:{createdAt:"desc"},take:100})]);
 return NextResponse.json({items,transactions,batches,evidence,canReview:finance});
}
export async function POST(req:Request) {
 const user=await getSession(); if(!user)return NextResponse.json({error:"Masuk kembali"},{status:401});
 try { const b=await req.json(); if(!String(b.text||"").trim())throw new Error("Isi keterangan.");
 await checkReference(user,b.transactionId,b.importBatchId,true);
 await prisma.operationNote.create({data:{transactionId:b.transactionId||null,importBatchId:b.importBatchId||null,authorId:user.id,authorName:user.nama,kind:b.kind==="correction"?"correction":"note",text:String(b.text).slice(0,3000)}});
 return NextResponse.json({ok:true}); }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Gagal"},{status:400});}
}
export async function PATCH(req:Request) {
 const user=await getSession(); if(!user||!isFinance(user.role))return NextResponse.json({error:"Hanya finance/owner"},{status:403});
 try{const b=await req.json();if(!String(b.resolution||"").trim())throw new Error("Isi hasil pemeriksaan.");
 const item=await prisma.operationNote.findUnique({where:{id:b.id}});if(!item)throw new Error("Tidak ditemukan");
 await checkReference(user,item.transactionId||undefined,item.importBatchId||undefined,true);
 await prisma.$transaction(async db=>{await db.operationNote.update({where:{id:b.id},data:{status:"reviewed",resolution:String(b.resolution).slice(0,3000),reviewedById:user.id}});await db.auditLog.create({data:{userId:user.id,userName:user.nama,aksi:"review",entitas:"operation",detail:`${b.id}: ${String(b.resolution).slice(0,3000)}`}});});return NextResponse.json({ok:true});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Gagal"},{status:400});}
}
