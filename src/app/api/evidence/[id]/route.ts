import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isFinance } from "@/lib/access";
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getSession();if(!user)return NextResponse.json({error:"Masuk kembali"},{status:401});const {id}=await params;
 const file=await prisma.evidence.findUnique({where:{id}});if(!file||(!isFinance(user.role)&&file.uploadedById!==user.id))return NextResponse.json({error:"Tidak ditemukan"},{status:404});
 return new Response(new Uint8Array(file.data),{headers:{"Content-Type":file.mime,"Content-Disposition":'attachment; filename="bukti.'+(file.mime==="application/pdf"?"pdf":file.mime==="image/png"?"png":"jpg")+'"',"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}
