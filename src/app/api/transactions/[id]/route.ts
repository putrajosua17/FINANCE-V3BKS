import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { formatRupiah } from "@/lib/format";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const b = await req.json();
    const data: Record<string, unknown> = {};
    if (b.tanggal !== undefined) data.tanggal = new Date(b.tanggal);
    if (b.jumlah !== undefined) {
      const j = Number(b.jumlah);
      if (!j || j <= 0) return NextResponse.json({ error: "Jumlah tidak valid" }, { status: 400 });
      data.jumlah = j;
    }
    if (b.categoryId !== undefined) data.categoryId = b.categoryId;
    if (b.accountId !== undefined) data.accountId = b.accountId;
    if (b.catatan !== undefined) data.catatan = b.catatan || null;
    if (b.namaEntitas !== undefined) data.namaEntitas = b.namaEntitas || null;
    if (b.noHp !== undefined) data.noHp = b.noHp || null;
    if (b.rateCode !== undefined) data.rateCode = b.rateCode || null;
    if (b.jam !== undefined) data.jam = b.jam || null;
    if (b.durasi !== undefined) data.durasi = b.durasi ? Number(b.durasi) : null;
    if (b.statusBayar !== undefined) data.statusBayar = b.statusBayar || null;
    if (b.tempatBeli !== undefined) data.tempatBeli = b.tempatBeli || null;

    // Hitung ulang pajak daerah bila jumlah/kategori berubah & kategori Rental
    if (b.jumlah !== undefined || b.categoryId !== undefined) {
      const catId = (data.categoryId as string) ?? (await prisma.transaction.findUnique({ where: { id }, select: { categoryId: true } }))?.categoryId;
      const cat = catId ? await prisma.category.findUnique({ where: { id: catId } }) : null;
      const jumlah = (data.jumlah as number) ?? (await prisma.transaction.findUnique({ where: { id }, select: { jumlah: true } }))?.jumlah ?? 0;
      data.pajakDaerah = cat?.nama?.toLowerCase() === "rental" ? Math.round((jumlah / 1.1) * 0.1) : 0;
    }

    const tx = await prisma.transaction.update({ where: { id }, data, include: { category: true } });
    await logAudit(session, "update", "transaction", `${tx.tipe} ${formatRupiah(tx.jumlah)} · ${tx.category.nama}`);
    return NextResponse.json({ ok: true, id: tx.id });
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const tx = await prisma.transaction.findUnique({ where: { id }, include: { category: true } });
    await prisma.transaction.delete({ where: { id } });
    if (tx) await logAudit(session, "delete", "transaction", `${tx.tipe} ${formatRupiah(tx.jumlah)} · ${tx.category.nama}`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}
