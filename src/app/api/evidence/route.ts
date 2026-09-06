import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkReference } from "@/lib/operation-access";
export async function POST(req:Request) {
 const user=await getSession();if(!user)return NextResponse.json({error:"Masuk kembali"},{status:401});
 try{const f=await req.formData();const file=f.get("file");if(!(file instanceof File)||file.size>2000000)throw new Error("Bukti maksimal 2 MB, format JPG, PNG, atau PDF.");
 const transactionId=String(f.get("transactionId")||"")||undefined,importBatchId=String(f.get("importBatchId")||"")||undefined;
 if(!transactionId&&!importBatchId)throw new Error("Pilih transaksi atau unggahan sumber.");
 await checkReference(user,transactionId,importBatchId,true);
 const data=Buffer.from(await file.arrayBuffer());
 const mime=data.subarray(0,5).toString()==="%PDF-"?"application/pdf":data[0]===255&&data[1]===216?"image/jpeg":data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?"image/png":null;
 if(!mime)throw new Error("Isi file bukan JPG, PNG, atau PDF yang didukung.");
 const evidence=await prisma.evidence.create({data:{transactionId,importBatchId,uploadedById:user.id,name:file.name.slice(0,200),mime,data}});return NextResponse.json({id:evidence.id});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unggah gagal"},{status:400});}
}
