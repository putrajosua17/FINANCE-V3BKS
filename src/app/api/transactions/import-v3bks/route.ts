import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ error: "Impor sekarang melalui pemeriksaan finance. Muat ulang halaman Impor Data." }, { status: 410 });
}
