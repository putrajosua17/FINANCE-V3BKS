import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Tandai pelunasan booking selesai → catat sisa sebagai income Rental.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 });
  if (booking.sisaPelunasan <= 0) return NextResponse.json({ ok: true });

  const rentalCat = await prisma.category.findFirst({ where: { nama: "Rental", tipe: "income" } });
  const account = booking.accountId
    ? { id: booking.accountId }
    : await prisma.account.findFirst({ orderBy: { urutan: "asc" } });

  const sisa = booking.sisaPelunasan;
  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        tanggal: new Date(),
        tipe: "income",
        jumlah: sisa,
        categoryId: rentalCat!.id,
        accountId: account!.id,
        rateCode: booking.kode,
        namaEntitas: booking.namaEntitas,
        noHp: booking.noHp,
        tanggalMain: booking.tanggalMain,
        statusBayar: "lunas",
        pajakDaerah: Math.round((sisa / 1.1) * 0.1),
        catatan: `Pelunasan booking ${booking.namaEntitas}`,
        createdById: session.id,
      },
    }),
    prisma.booking.update({ where: { id }, data: { sisaPelunasan: 0, status: "lunas" } }),
  ]);

  return NextResponse.json({ ok: true });
}
