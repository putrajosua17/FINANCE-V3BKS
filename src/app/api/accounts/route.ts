import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    if (!b.nama) return NextResponse.json({ error: "Nama rekening wajib" }, { status: 400 });
    const exist = await prisma.account.findUnique({ where: { nama: String(b.nama).trim() } });
    if (exist) return NextResponse.json({ error: "Rekening sudah ada" }, { status: 400 });
    const count = await prisma.account.count();
    const acc = await prisma.account.create({
      data: {
        nama: String(b.nama).trim(),
        tipe: b.tipe === "cash" ? "cash" : "bank",
        saldoAwal: Math.max(0, Number(b.saldoAwal) || 0),
        urutan: count + 1,
      },
    });
    return NextResponse.json({ ok: true, item: acc });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan rekening" }, { status: 500 });
  }
}
