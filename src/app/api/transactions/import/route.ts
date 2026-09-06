import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ error: "Versi ini memakai CSV tracker V3BKS melalui pusat impor dan persetujuan." }, { status: 410 });
}
