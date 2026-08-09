// -----------------------------------------------------------------------------
// F-01 · Mesin Double-Entry — pembentukan & pembalikan jurnal otomatis
// -----------------------------------------------------------------------------
// Prinsip:
//  1. Σ debit == Σ kredit pada setiap JournalEntry (ditegakkan di sini).
//  2. JournalEntry bersifat append-only. Koreksi lewat reversing entry.
//  3. Nomor jurnal berurutan per periode: JV-YYYY-MM-0001.
//
// Semua fungsi menerima klien Prisma (`db`) agar bisa dijalankan di dalam
// satu transaksi database — menjamin jurnal & transaksi tersimpan atomik.

import type { Prisma, PrismaClient } from "@prisma/client";
import { coaForAccount, coaForCategory } from "@/lib/coa";

export type Db = PrismaClient | Prisma.TransactionClient;

export type JurnalLineInput = { coaId: string; debit?: number; kredit?: number; memo?: string };

const RP = 1; // toleransi pembulatan 1 rupiah

/** Lempar error bila total debit != total kredit. */
export function assertBalanced(lines: JurnalLineInput[]): void {
  const debit = lines.reduce((s, l) => s + (l.debit ?? 0), 0);
  const kredit = lines.reduce((s, l) => s + (l.kredit ?? 0), 0);
  if (Math.abs(debit - kredit) > RP) {
    throw new Error(`Jurnal tidak seimbang: debit ${debit} ≠ kredit ${kredit}`);
  }
  if (lines.length < 2) throw new Error("Jurnal wajib memiliki minimal 2 baris.");
}

/** Nomor jurnal berurutan per periode berbasis tanggal (JV-YYYY-MM-NNNN). */
export async function nextJournalNumber(db: Db, tanggal: Date): Promise<string> {
  const yyyy = tanggal.getFullYear();
  const mm = String(tanggal.getMonth() + 1).padStart(2, "0");
  const prefix = `JV-${yyyy}-${mm}-`;
  const last = await db.journalEntry.findFirst({
    where: { nomor: { startsWith: prefix } },
    orderBy: { nomor: "desc" },
    select: { nomor: true },
  });
  const lastSeq = last ? parseInt(last.nomor.slice(prefix.length), 10) || 0 : 0;
  return `${prefix}${String(lastSeq + 1).padStart(4, "0")}`;
}

/** Cache kode COA -> id agar tidak query berulang saat backfill massal. */
export async function loadCoaIndex(db: Db): Promise<Map<string, string>> {
  const rows = await db.chartOfAccount.findMany({ select: { id: true, kode: true } });
  return new Map(rows.map((r) => [r.kode, r.id]));
}

async function resolveCoaId(db: Db, kode: string, index?: Map<string, string>): Promise<string> {
  if (index?.has(kode)) return index.get(kode)!;
  const row = await db.chartOfAccount.findUnique({ where: { kode }, select: { id: true } });
  if (!row) throw new Error(`Akun COA "${kode}" belum di-seed. Jalankan seed Chart of Accounts.`);
  index?.set(kode, row.id);
  return row.id;
}

type TxForJournal = {
  id: string;
  tipe: string;
  jumlah: number;
  tanggal: Date;
  businessUnitId: string | null;
  createdById: string | null;
  namaEntitas: string | null;
  tempatBeli: string | null;
  category: { nama: string; tipe: string };
  account: { nama: string };
};

/**
 * Bentuk baris jurnal untuk sebuah transaksi kas single-entry:
 *  - income  : Debit kas/bank, Kredit pendapatan (kategori)
 *  - expense : Debit beban (kategori), Kredit kas/bank
 * Sehingga total pendapatan/beban di jurnal identik dengan laporan kas.
 */
export async function buildTransactionLines(
  db: Db,
  tx: TxForJournal,
  index?: Map<string, string>
): Promise<JurnalLineInput[]> {
  const kasKode = coaForAccount(tx.account.nama);
  const kategoriKode = coaForCategory(tx.category.nama, tx.category.tipe);
  const kasId = await resolveCoaId(db, kasKode, index);
  const kategoriId = await resolveCoaId(db, kategoriKode, index);
  const jumlah = Math.round(tx.jumlah);
  const memo = tx.namaEntitas || tx.tempatBeli || tx.category.nama;

  if (tx.tipe === "income") {
    return [
      { coaId: kasId, debit: jumlah, memo },
      { coaId: kategoriId, kredit: jumlah, memo },
    ];
  }
  return [
    { coaId: kategoriId, debit: jumlah, memo },
    { coaId: kasId, kredit: jumlah, memo },
  ];
}

/** Buat JournalEntry + baris untuk sekumpulan input yang sudah seimbang. */
export async function createJournalEntry(
  db: Db,
  input: {
    tanggal: Date;
    deskripsi: string;
    sumber: string;
    sumberId?: string | null;
    businessUnitId?: string | null;
    createdById?: string | null;
    lines: JurnalLineInput[];
  }
) {
  assertBalanced(input.lines);
  const nomor = await nextJournalNumber(db, input.tanggal);
  return db.journalEntry.create({
    data: {
      nomor,
      tanggal: input.tanggal,
      deskripsi: input.deskripsi,
      sumber: input.sumber,
      sumberId: input.sumberId ?? null,
      businessUnitId: input.businessUnitId ?? null,
      createdById: input.createdById ?? null,
      lines: {
        create: input.lines.map((l) => ({
          coaId: l.coaId,
          debit: l.debit ?? 0,
          kredit: l.kredit ?? 0,
          memo: l.memo ?? null,
        })),
      },
    },
  });
}

/**
 * Bentuk jurnal untuk satu transaksi & tautkan (Transaction.journalEntryId).
 * Idempoten: bila transaksi sudah punya jurnal, tidak membuat duplikat.
 */
export async function postJournalForTransaction(
  db: Db,
  txId: string,
  index?: Map<string, string>
): Promise<string | null> {
  const tx = (await db.transaction.findUnique({
    where: { id: txId },
    include: { category: true, account: true },
  })) as (TxForJournal & { journalEntryId: string | null }) | null;
  if (!tx) return null;
  if (tx.journalEntryId) return tx.journalEntryId; // sudah ada — idempoten

  const lines = await buildTransactionLines(db, tx, index);
  const entry = await createJournalEntry(db, {
    tanggal: tx.tanggal,
    deskripsi: `${tx.tipe === "income" ? "Pemasukan" : "Pengeluaran"} · ${tx.category.nama}`,
    sumber: "transaction",
    sumberId: tx.id,
    businessUnitId: tx.businessUnitId,
    createdById: tx.createdById,
    lines,
  });
  await db.transaction.update({ where: { id: tx.id }, data: { journalEntryId: entry.id } });
  return entry.id;
}

/**
 * Buat reversing entry untuk sebuah jurnal (debit<->kredit ditukar).
 * Idempoten: bila sudah pernah dibalik, kembalikan jurnal pembalik yang ada.
 */
export async function reverseJournalEntry(
  db: Db,
  entryId: string,
  opts: { tanggal?: Date; createdById?: string | null } = {}
): Promise<string | null> {
  const existing = await db.journalEntry.findFirst({ where: { reversalOfId: entryId }, select: { id: true } });
  if (existing) return existing.id;

  const entry = await db.journalEntry.findUnique({ where: { id: entryId }, include: { lines: true } });
  if (!entry) return null;

  const tanggal = opts.tanggal ?? new Date();
  const nomor = await nextJournalNumber(db, tanggal);
  const reversal = await db.journalEntry.create({
    data: {
      nomor,
      tanggal,
      deskripsi: `Pembalik atas ${entry.nomor} — ${entry.deskripsi}`,
      sumber: "reversal",
      sumberId: entry.sumberId,
      businessUnitId: entry.businessUnitId,
      isReversal: true,
      reversalOfId: entry.id,
      createdById: opts.createdById ?? null,
      lines: {
        create: entry.lines.map((l) => ({
          coaId: l.coaId,
          debit: l.kredit, // tukar
          kredit: l.debit,
          memo: l.memo,
        })),
      },
    },
  });
  return reversal.id;
}
