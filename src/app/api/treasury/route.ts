import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isFinance } from "@/lib/access";
import { assertPeriodOpen } from "@/lib/period-lock";
import { createJournalEntry,loadCoaIndex,reverseJournalEntry } from "@/lib/journal";
export async function POST(req:Request){
 const user=await getSession();if(!user||!isFinance(user.role))return NextResponse.json({error:"Hanya finance/owner"},{status:403});
 try{const b=await req.json();const tanggal=new Date(b.date+"T00:00:00Z"),amount=Number(b.amount);if(!Number.isFinite(tanggal.getTime())||!Number.isFinite(amount)||amount<0||!String(b.note||"").trim())throw new Error("Tanggal, nominal, dan sumber bukti wajib valid.");
 await prisma.$transaction(async db=>{
 await db.$executeRaw`SELECT pg_advisory_xact_lock(7300601)`;
 const unit=await db.businessUnit.findUnique({where:{kode:"V3BKS-MS"}});
 await assertPeriodOpen(db,tanggal,unit?.id);
 const coa=await loadCoaIndex(db);
 if(b.action==="opening"){
  const a=await db.account.findUnique({where:{id:b.accountId}});if(!a)throw new Error("Rekening tidak ditemukan.");
  const before=await db.transaction.findFirst({where:{accountId:a.id,deletedAt:null,tanggal:{lt:tanggal}}});
  const transfer=await db.internalTransfer.findFirst({where:{tanggal:{lt:tanggal},OR:[{fromAccountId:a.id},{toAccountId:a.id}]}});
  if(before||transfer)throw new Error("Tanggal saldo awal harus mendahului seluruh transaksi rekening. Koreksi transaksi lama terlebih dahulu.");
  if(a.openingDate)await assertPeriodOpen(db,a.openingDate);
  if(a.openingJournalId)await reverseJournalEntry(db,a.openingJournalId,{tanggal:a.openingDate||tanggal,createdById:user.id});
  const cash=a.coaId, equity=coa.get("3-1000");if(!cash||!equity)throw new Error("Pemetaan akun belum lengkap.");
  const j=await createJournalEntry(db,{tanggal,deskripsi:`Saldo awal ${a.nama}: ${b.note}`,sumber:"opening",createdById:user.id,lines:[{coaId:cash,debit:amount},{coaId:equity,kredit:amount}]});
  await db.account.update({where:{id:a.id},data:{saldoAwal:amount,openingDate:tanggal,openingEvidence:String(b.note).slice(0,2000),openingJournalId:j.id}});
 }else if(b.action==="transfer"){
  if(amount<=0||b.from===b.to||!b.requestId)throw new Error("Pilih dua rekening berbeda dan nominal lebih dari nol.");
  const exists=await db.internalTransfer.findUnique({where:{id:String(b.requestId)}});if(exists)return;
  const from=await db.account.findUnique({where:{id:b.from}}),to=await db.account.findUnique({where:{id:b.to}});
  if(!from?.isActive||!to?.isActive||!from.coaId||!to.coaId)throw new Error("Rekening aktif dan pemetaan COA wajib tersedia.");
  if((from.openingDate&&tanggal<from.openingDate)||(to.openingDate&&tanggal<to.openingDate))throw new Error("Tanggal transfer mendahului saldo awal.");
  const j=await createJournalEntry(db,{tanggal,deskripsi:`Transfer ${from.nama} → ${to.nama}: ${b.note}`,sumber:"transfer",createdById:user.id,lines:[{coaId:to.coaId,debit:amount},{coaId:from.coaId,kredit:amount}]});
  await db.internalTransfer.create({data:{id:String(b.requestId),fromAccountId:from.id,toAccountId:to.id,amount,tanggal,note:String(b.note).slice(0,2000),journalEntryId:j.id,createdById:user.id}});
 }else throw new Error("Tindakan tidak dikenal");
 await db.auditLog.create({data:{userId:user.id,userName:user.nama,aksi:b.action,entitas:"account",detail:JSON.stringify({accountId:b.accountId,from:b.from,to:b.to,amount,date:b.date,note:b.note})}});
 },{timeout:30000});return NextResponse.json({ok:true});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Gagal menyimpan"},{status:400});}
}
