import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { formatRupiah } from "@/lib/format";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const bill = await prisma.bill.findUnique({ where: { id } });
  if (!bill) return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
  if (bill.status === "paid") return NextResponse.json({ ok: true });

  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        tanggal: new Date(),
        tipe: "expense",
        jumlah: bill.nominalEstimasi,
        categoryId: bill.categoryId!,
        accountId: bill.accountId!,
        catatan: `Pembayaran tagihan: ${bill.nama}`,
        createdById: session.id,
      },
    }),
    prisma.bill.update({ where: { id }, data: { status: "paid" } }),
  ]);

  await logAudit(session, "pay", "bill", `${bill.nama} · ${formatRupiah(bill.nominalEstimasi)}`);
  return NextResponse.json({ ok: true });
}
