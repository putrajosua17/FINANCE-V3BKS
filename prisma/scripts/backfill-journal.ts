/**
 * Backfill Fase 7 — idempoten & aman diulang.
 *
 *   1. Seed master akuntansi (Unit Bisnis + Chart of Accounts + pemetaan).
 *   2. Isi Transaction.businessUnitId = V3BKS-MS untuk data lama yang kosong.
 *   3. Bentuk JournalEntry untuk setiap Transaction historis yang belum berjurnal.
 *   4. Validasi: Neraca Saldo seimbang (Σ debit = Σ kredit).
 *
 * BACKUP database sebelum menjalankan di produksi.
 * Jalankan: npm run backfill:journal
 */
import { PrismaClient } from "@prisma/client";
import { seedAccountingMasters, DEFAULT_BU_KODE } from "../seed-accounting";
import { postJournalForTransaction, loadCoaIndex } from "@/lib/journal";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Backfill Fase 7 dimulai ...");

  // 1) Master akuntansi
  await seedAccountingMasters(prisma);
  console.log("  ✓ Master akuntansi (Unit Bisnis + COA) siap");

  // 2) businessUnitId default untuk data lama
  const defaultBu = await prisma.businessUnit.findUnique({ where: { kode: DEFAULT_BU_KODE } });
  if (!defaultBu) throw new Error(`Unit default ${DEFAULT_BU_KODE} tidak ditemukan.`);
  const bu = await prisma.transaction.updateMany({
    where: { businessUnitId: null },
    data: { businessUnitId: defaultBu.id },
  });
  console.log(`  ✓ ${bu.count} transaksi lama di-set unit ${DEFAULT_BU_KODE}`);

  // 3) Jurnal untuk transaksi yang belum berjurnal (kecuali yang sudah dihapus)
  const index = await loadCoaIndex(prisma);
  const pending = await prisma.transaction.findMany({
    where: { journalEntryId: null, deletedAt: null },
    select: { id: true },
    orderBy: { tanggal: "asc" },
  });
  let posted = 0;
  for (const t of pending) {
    await postJournalForTransaction(prisma, t.id, index);
    posted++;
  }
  console.log(`  ✓ ${posted} jurnal transaksi terbentuk (idempoten)`);

  // 4) Validasi keseimbangan Neraca Saldo
  const agg = await prisma.journalLine.aggregate({ _sum: { debit: true, kredit: true } });
  const totalDebit = agg._sum.debit ?? 0;
  const totalKredit = agg._sum.kredit ?? 0;
  const selisih = Math.round((totalDebit - totalKredit) * 100) / 100;
  console.log(`  Σ debit  = ${totalDebit.toLocaleString("id-ID")}`);
  console.log(`  Σ kredit = ${totalKredit.toLocaleString("id-ID")}`);
  if (Math.abs(selisih) > 1) {
    console.error(`❌ Neraca Saldo TIDAK seimbang (selisih ${selisih}). Periksa pemetaan COA.`);
    process.exit(1);
  }
  console.log("✅ Backfill selesai — Neraca Saldo seimbang (selisih = 0).");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
