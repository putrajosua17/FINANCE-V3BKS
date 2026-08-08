import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    if (!b.kode || !b.namaEntitas || !b.tanggalMain) {
      return NextResponse.json({ error: "Kode, penyewa, tanggal main wajib" }, { status: 400 });
    }
    const harga = Math.max(0, Number(b.harga) || 0);
    const dp = Math.max(0, Number(b.dp) || 0);
    const sisa = Math.max(0, harga - dp);
    const booking = await prisma.booking.create({
      data: {
        kode: String(b.kode).trim().toUpperCase(),
        tanggalMain: new Date(b.tanggalMain),
        jamMulai: b.jamMulai || null,
        jamSelesai: b.jamSelesai || null,
        durasi: b.durasi ? Number(b.durasi) : null,
        namaEntitas: String(b.namaEntitas).trim(),
        noHp: b.noHp || null,
        harga,
        dp,
        sisaPelunasan: sisa,
        status: sisa === 0 && harga > 0 ? "lunas" : dp > 0 ? "dp" : "booked",
        accountId: b.accountId || null,
        catatan: b.catatan || null,
      },
    });
    await logAudit(session, "create", "booking", `${booking.namaEntitas} · ${booking.kode}`);
    return NextResponse.json({ ok: true, item: booking });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan booking" }, { status: 500 });
  }
}
