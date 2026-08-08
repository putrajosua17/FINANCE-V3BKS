import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    if (!b.kode || !b.nama || !b.kelompok) {
      return NextResponse.json({ error: "Kode, nama, kelompok wajib" }, { status: 400 });
    }
    const exist = await prisma.rateCard.findUnique({ where: { kode: b.kode } });
    if (exist) return NextResponse.json({ error: "Kode sudah dipakai" }, { status: 400 });

    const rc = await prisma.rateCard.create({
      data: {
        kode: String(b.kode).trim(),
        nama: String(b.nama).trim(),
        kelompok: String(b.kelompok).trim(),
        hari: b.hari || null,
        jamMulai: b.jamMulai || null,
        jamSelesai: b.jamSelesai || null,
        durasi: b.durasi ? Number(b.durasi) : null,
        harga: Math.max(0, Number(b.harga) || 0),
      },
    });
    return NextResponse.json({ ok: true, item: rc });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan tarif" }, { status: 500 });
  }
}
