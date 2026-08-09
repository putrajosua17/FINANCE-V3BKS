import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { formatRupiah } from "@/lib/format";
import { postJournalForTransaction, reverseJournalEntry } from "@/lib/journal";
import { assertPeriodOpen, PeriodLockedError } from "@/lib/period-lock";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const before = await prisma.transaction.findUnique({ where: { id }, include: { category: true } });
    if (!before || before.deletedAt) return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });

    // F-05: periode transaksi lama & (bila diubah) tanggal baru harus terbuka.
    await assertPeriodOpen(prisma, before.tanggal, before.businessUnitId);

    const b = await req.json();
    if (b.tanggal !== undefined) await assertPeriodOpen(prisma, new Date(b.tanggal), before.businessUnitId);

    const data: Record<string, unknown> = {};
    if (b.tanggal !== undefined) data.tanggal = new Date(b.tanggal);
    if (b.jumlah !== undefined) {
      const j = Number(b.jumlah);
      if (!j || j <= 0) return NextResponse.json({ error: "Jumlah tidak valid" }, { status: 400 });
      data.jumlah = j;
    }
    if (b.categoryId !== undefined) data.categoryId = b.categoryId;
    if (b.accountId !== undefined) data.accountId = b.accountId;
    if (b.businessUnitId !== undefined) data.businessUnitId = b.businessUnitId || null;
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
      const catId = (data.categoryId as string) ?? before.categoryId;
      const cat = catId ? await prisma.category.findUnique({ where: { id: catId } }) : null;
      const jumlah = (data.jumlah as number) ?? before.jumlah;
      data.pajakDaerah = cat?.nama?.toLowerCase() === "rental" ? Math.round((jumlah / 1.1) * 0.1) : 0;
    }

    // F-01: jurnal append-only → balik entri lama, buat entri baru dari data terkini.
    const tx = await prisma.$transaction(async (db) => {
      const updated = await db.transaction.update({ where: { id }, data, include: { category: true } });
      if (before.journalEntryId) {
        await reverseJournalEntry(db, before.journalEntryId, { tanggal: updated.tanggal, createdById: session.id });
      }
      await db.transaction.update({ where: { id }, data: { journalEntryId: null } });
      await postJournalForTransaction(db, id);
      return updated;
    });

    await logAudit(session, "update", "transaction", `${tx.tipe} ${formatRupiah(tx.jumlah)} · ${tx.category.nama}`, {
      nilaiLama: { jumlah: before.jumlah, tanggal: before.tanggal, kategori: before.category.nama },
      nilaiBaru: { jumlah: tx.jumlah, tanggal: tx.tanggal, kategori: tx.category.nama },
    });
    return NextResponse.json({ ok: true, id: tx.id });
  } catch (e) {
    if (e instanceof PeriodLockedError) return NextResponse.json({ error: e.message }, { status: 423 });
    return NextResponse.json({ error: "Gagal memperbarui" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const tx = await prisma.transaction.findUnique({ where: { id }, include: { category: true } });
    if (!tx || tx.deletedAt) return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });

    // F-05: tidak boleh menghapus transaksi di periode terkunci.
    await assertPeriodOpen(prisma, tx.tanggal, tx.businessUnitId);

    // F-05 soft delete + F-01 reversing entry (jurnal tidak pernah dihapus).
    await prisma.$transaction(async (db) => {
      if (tx.journalEntryId) {
        await reverseJournalEntry(db, tx.journalEntryId, { tanggal: new Date(), createdById: session.id });
      }
      await db.transaction.update({ where: { id }, data: { deletedAt: new Date(), deletedById: session.id } });
    });

    await logAudit(session, "delete", "transaction", `${tx.tipe} ${formatRupiah(tx.jumlah)} · ${tx.category.nama}`, {
      nilaiLama: { jumlah: tx.jumlah, tanggal: tx.tanggal, kategori: tx.category.nama },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof PeriodLockedError) return NextResponse.json({ error: e.message }, { status: 423 });
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}
