import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const b = await req.json();
    const data: Record<string, unknown> = {};
    if (b.status !== undefined) {
      if(!["booked","selesai","batal"].includes(b.status))return NextResponse.json({error:"Status pembayaran dihitung dari impor yang disetujui."},{status:400});
      data.status = b.status;
    }
    if (b.namaEntitas !== undefined) data.namaEntitas = String(b.namaEntitas).trim();
    if (b.noHp !== undefined) data.noHp = b.noHp || null;
    if (b.kode !== undefined) data.kode = String(b.kode).trim().toUpperCase();
    if (b.tanggalMain !== undefined) data.tanggalMain = new Date(b.tanggalMain);
    if (b.harga !== undefined || b.dp !== undefined) {
      const cur = await prisma.booking.findUnique({ where: { id } });
      const harga = b.harga !== undefined ? Math.max(0, Number(b.harga) || 0) : cur?.harga ?? 0;
      if(b.dp !== undefined)return NextResponse.json({error:"Hubungkan DP melalui menu Pembayaran."},{status:400});
      const linked=await prisma.transaction.aggregate({where:{bookingId:id,deletedAt:null},_sum:{jumlah:true}});
      const dp = linked._sum.jumlah ?? 0;
      data.harga = harga;
      data.dp = dp;
      data.sisaPelunasan = Math.max(0, harga - dp);
      data.status = harga>0&&dp>=harga?"lunas":dp>0?"dp":"booked";
    }
    const booking = await prisma.booking.update({ where: { id }, data });
    await logAudit(session, "update", "booking", `${booking.namaEntitas} · ${booking.status}`);
    return NextResponse.json({ ok: true, item: booking });
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui booking" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    if(await prisma.transaction.count({where:{bookingId:id,deletedAt:null}}))return NextResponse.json({error:"Booking sudah memiliki pembayaran. Gunakan pembatalan dan catatan koreksi."},{status:400});
    await prisma.booking.delete({ where: { id } });
    await logAudit(session, "delete", "booking", `Booking ${id}`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}
