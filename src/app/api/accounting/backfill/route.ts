import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { defaultBusinessUnitId } from "@/lib/business-unit";
import { loadCoaIndex, postJournalForTransaction } from "@/lib/journal";

export const dynamic = "force-dynamic";

/**
 * Perbaikan idempoten untuk data yang diimpor sebelum mesin jurnal aktif.
 * Hanya owner, hanya transaksi aktif yang belum berjurnal, dan seluruh proses
 * atomik. Menjalankan endpoint ini kembali tidak membuat jurnal ganda.
 */
export async function POST() {
  const session = await requireRole(["owner"]);
  if (!session) return NextResponse.json({ error: "Hanya owner yang dapat memperbaiki jurnal." }, { status: 403 });

  try {
    const result = await prisma.$transaction(async (db) => {
      const businessUnitId = await defaultBusinessUnitId(db);
      if (businessUnitId) {
        await db.transaction.updateMany({
          where: { businessUnitId: null, deletedAt: null },
          data: { businessUnitId },
        });
      }

      const pending = await db.transaction.findMany({
        where: { journalEntryId: null, deletedAt: null },
        select: { id: true },
        orderBy: [{ tanggal: "asc" }, { createdAt: "asc" }],
      });
      const coaIndex = await loadCoaIndex(db);
      let posted = 0;
      for (const tx of pending) {
        const journalId = await postJournalForTransaction(db, tx.id, coaIndex);
        if (journalId) posted++;
      }

      const totals = await db.journalLine.aggregate({ _sum: { debit: true, kredit: true } });
      const debit = totals._sum.debit ?? 0;
      const kredit = totals._sum.kredit ?? 0;
      const selisih = Math.round((debit - kredit) * 100) / 100;
      if (Math.abs(selisih) > 1) throw new Error(`Jurnal tidak seimbang setelah perbaikan (selisih ${selisih}).`);
      return { posted, debit, kredit, selisih };
    }, { maxWait: 10_000, timeout: 120_000 });

    await logAudit(session, "repair", "journal", `${result.posted} transaksi lama dibentuk jurnal`, { nilaiBaru: result });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal memperbaiki jurnal" }, { status: 500 });
  }
}
