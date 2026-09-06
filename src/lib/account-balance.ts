import type { Db } from "./journal";
export async function transferBalance(db:Db,accountId:string,end:Date=new Date("9999-12-31")) {
 const [incoming,outgoing]=await Promise.all([db.internalTransfer.aggregate({where:{toAccountId:accountId,tanggal:{lte:end}},_sum:{amount:true}}),db.internalTransfer.aggregate({where:{fromAccountId:accountId,tanggal:{lte:end}},_sum:{amount:true}})]);
 return (incoming._sum.amount||0)-(outgoing._sum.amount||0);
}
