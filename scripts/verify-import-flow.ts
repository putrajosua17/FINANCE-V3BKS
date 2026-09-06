// Run only against an isolated database: DATABASE_URL must point to localhost.
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { seedAccountingMasters } from "../prisma/seed-accounting";
import { createImport, approveImport } from "../src/lib/import-service";
import { fileHash } from "../src/lib/import-review";
const url=process.env.DATABASE_URL || "";
if(!/^postgres(?:ql)?:\/\/[^@]*@(localhost|127\.0\.0\.1):/.test(url))throw new Error("Use an isolated local database only.");
function csv(amount=100000,note="TF BCA", order=false) {
 const row=Array(22).fill("");Object.assign(row,{1:"1 September 2026",2:"Rental",7:"Pelanggan Uji",10:"TRUE",11:"FALSE",12:String(amount),13:note});
 return (order?"\n\n":"")+row.join(",");
}
async function main(){
 await seedAccountingMasters(prisma);
 const admin=await prisma.user.create({data:{nama:"Kasir Uji",email:`test-${Date.now()}@example.invalid`,passwordHash:"unused",role:"admin"}});
 const user={id:admin.id,nama:admin.nama,email:admin.email,role:"admin"};
 const finance={...user,role:"finance"};
 await prisma.category.createMany({data:[{nama:"Rental",tipe:"income"}],skipDuplicates:true});
 await prisma.account.createMany({data:[{nama:"BCA",tipe:"bank"}],skipDuplicates:true});
 await seedAccountingMasters(prisma);
 const batch=await createImport(csv(),"test.csv",user);
 assert.equal(await prisma.transaction.count(),0,"draft does not affect balance");
 assert.equal((await createImport(csv(),"copy.csv",user)).id,batch.id,"same file reopens draft");
 await prisma.importBatch.update({where:{id:batch.id},data:{status:"submitted"}});
 await approveImport(batch.id,finance);
 assert.equal(await prisma.transaction.count(),1);
 assert.equal(await prisma.journalEntry.count({where:{sumber:"transaction"}}),1);
 await assert.rejects(()=>approveImport(batch.id,finance));
 const reordered=await createImport(csv()+"\n,,,,","reordered.csv",user);
 const lines=await prisma.importLine.findMany({where:{batchId:reordered.id}});
 assert.equal(lines[0].decision,"skip","row order does not duplicate a payment");
 const correction=await createImport(csv(120000),"correction.csv",user);
 const c=await prisma.importLine.findFirstOrThrow({where:{batchId:correction.id}});
 assert.equal(c.decision,"review");
 const old=await prisma.transaction.findFirstOrThrow();
 await prisma.importLine.update({where:{id:c.id},data:{decision:"replace",replacesId:old.id}});
 await prisma.importBatch.update({where:{id:correction.id},data:{status:"submitted"}});
 await approveImport(correction.id,finance);
 assert.equal(await prisma.transaction.count({where:{deletedAt:null}}),1);
 assert.equal((await prisma.transaction.findFirstOrThrow({where:{deletedAt:null}})).jumlah,120000);
 assert.equal(await prisma.journalEntry.count({where:{isReversal:true}}),1);
 const unknown=await createImport(csv(130000,"LUNAS"),"unknown.csv",user);
 const u=await prisma.importLine.findFirstOrThrow({where:{batchId:unknown.id}});
 assert.equal(u.accountId,null);
 await prisma.importLine.update({where:{id:u.id},data:{decision:"new"}});
 await prisma.importBatch.update({where:{id:unknown.id},data:{status:"submitted"}});
 await assert.rejects(()=>approveImport(unknown.id,finance));
 assert.equal(await prisma.transaction.count({where:{deletedAt:null}}),1,"failed approval rolls back");
 await prisma.periodLock.create({data:{periode:"2026-09",status:"terkunci"}});
 const locked=await createImport(csv(140000),"locked.csv",user);
 await prisma.importLine.updateMany({where:{batchId:locked.id},data:{decision:"new"}});
 await prisma.importBatch.update({where:{id:locked.id},data:{status:"submitted"}});
 await assert.rejects(()=>approveImport(locked.id,finance),/dikunci/);
 assert.equal(await prisma.transaction.count({where:{deletedAt:null}}),1);
 console.log("PASS: migrations, draft isolation, repeat import, journal creation, correction/reversal, atomic failure, period locking.");
 await prisma.periodLock.deleteMany();
}
main().finally(()=>prisma.$disconnect());
