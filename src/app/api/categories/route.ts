import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    if (!b.nama || !b.tipe) return NextResponse.json({ error: "Nama & tipe wajib" }, { status: 400 });
    const tipe = b.tipe === "expense" ? "expense" : "income";
    const exist = await prisma.category.findFirst({ where: { nama: String(b.nama).trim(), tipe } });
    if (exist) return NextResponse.json({ error: "Kategori sudah ada" }, { status: 400 });
    const count = await prisma.category.count({ where: { tipe } });
    const cat = await prisma.category.create({
      data: {
        nama: String(b.nama).trim(),
        tipe,
        isRecurring: Boolean(b.isRecurring),
        urutan: count + 1,
      },
    });
    return NextResponse.json({ ok: true, item: cat });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan kategori" }, { status: 500 });
  }
}
