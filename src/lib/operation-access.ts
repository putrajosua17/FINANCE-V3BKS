import { prisma } from "./prisma";
import type { SessionUser } from "./auth";
import { isFinance } from "./access";
import { assertPeriodOpen } from "./period-lock";
export async function checkReference(user:SessionUser, transactionId?:string, importBatchId?:string, writing=false) {
 if (transactionId) {
   const tx=await prisma.transaction.findUnique({where:{id:transactionId}});
   if(!tx || tx.deletedAt) throw new Error("Transaksi tidak ditemukan.");
   if(!isFinance(user.role) && tx.createdById!==user.id) throw new Error("Pilih transaksi dari unggahan Anda.");
   if(writing) await assertPeriodOpen(prisma,tx.tanggal,tx.businessUnitId);
 }
 if (importBatchId) {
  const batch=await prisma.importBatch.findUnique({where:{id:importBatchId}});
  if(!batch || (!isFinance(user.role)&&batch.uploadedById!==user.id)) throw new Error("Unggahan tidak ditemukan.");
 }
}
