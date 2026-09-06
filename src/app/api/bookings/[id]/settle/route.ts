import { NextResponse } from "next/server";
export async function POST(){return NextResponse.json({error:"Pembayaran dicatat melalui tracker dan persetujuan impor. Hubungkan transaksi pelunasan di menu DP & Pelunasan."},{status:409});}
