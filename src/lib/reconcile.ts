// -----------------------------------------------------------------------------
// F-02 · Algoritma auto-matching rekonsiliasi bank (skor berbobot)
// -----------------------------------------------------------------------------
// Bobot (PRD): nominal 0,50 · selisih tanggal ≤1 hari 0,25 · kecocokan teks 0,15
// · rekening sama 0,10 (prasyarat). Skor ≥0,85 auto-match; 0,60–0,85 saran.
import type { Db } from "@/lib/journal";

export const AUTO_MATCH_THRESHOLD = 0.85;
export const SUGGEST_THRESHOLD = 0.6;

export type CandidateTx = {
  id: string;
  tanggal: Date;
  tipe: string;
  jumlah: number;
  namaEntitas: string | null;
  catatan: string | null;
  tempatBeli: string | null;
};

export type LineForMatch = {
  tanggal: Date;
  keterangan: string;
  debit: number;
  kredit: number;
};

function normalizeText(s: string | null | undefined): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function trigrams(s: string): Set<string> {
  const t = normalizeText(s).replace(/\s+/g, " ");
  const set = new Set<string>();
  const padded = `  ${t} `;
  for (let i = 0; i < padded.length - 2; i++) set.add(padded.slice(i, i + 3));
  return set;
}

/** Kemiripan trigram (Jaccard) 0..1. */
export function trigramSim(a: string, b: string): number {
  const A = trigrams(a);
  const B = trigrams(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return inter / (A.size + B.size - inter);
}

function dateScore(a: Date, b: Date): number {
  const diff = Math.abs(a.getTime() - b.getTime()) / 86_400_000;
  if (diff <= 1) return 0.25;
  if (diff >= 4) return 0;
  return 0.25 * ((4 - diff) / 3);
}

/** Arah mutasi bank: kredit = uang masuk (income), debit = uang keluar (expense). */
export function lineDirection(line: LineForMatch): { tipe: "income" | "expense"; nominal: number } {
  if (line.kredit > 0) return { tipe: "income", nominal: line.kredit };
  return { tipe: "expense", nominal: line.debit };
}

/** Skor kecocokan satu baris mutasi terhadap satu transaksi (0..1). */
export function scoreMatch(line: LineForMatch, tx: CandidateTx): number {
  const dir = lineDirection(line);
  if (tx.tipe !== dir.tipe) return 0; // arah harus sama
  let score = 0.1; // rekening sama (prasyarat — kandidat sudah difilter per rekening)
  if (Math.abs(tx.jumlah - dir.nominal) < 1) score += 0.5;
  else return 0; // nominal wajib cocok agar layak dipertimbangkan
  score += dateScore(line.tanggal, tx.tanggal);
  const teks = trigramSim(line.keterangan, `${tx.namaEntitas ?? ""} ${tx.catatan ?? ""} ${tx.tempatBeli ?? ""}`);
  score += 0.15 * teks;
  return Math.min(1, score);
}

export type Suggestion = { transactionId: string; skor: number };

/** Kandidat terbaik (skor tertinggi) untuk sebuah baris di antara transaksi. */
export function bestMatch(line: LineForMatch, candidates: CandidateTx[]): Suggestion | null {
  let best: Suggestion | null = null;
  for (const tx of candidates) {
    const skor = scoreMatch(line, tx);
    if (skor <= 0) continue;
    if (!best || skor > best.skor) best = { transactionId: tx.id, skor };
  }
  return best;
}

/**
 * Jalankan auto-matching untuk seluruh baris "belum" pada satu statement.
 * Menetapkan pasangan berskor ≥0,85 (greedy dari skor tertinggi, satu transaksi
 * hanya dipakai sekali). Mengembalikan ringkasan.
 */
export async function autoReconcile(db: Db, statementId: string) {
  const statement = await db.bankStatement.findUnique({
    where: { id: statementId },
    include: { lines: { where: { status: "belum" } } },
  });
  if (!statement) return { auto: 0, saran: 0 };

  // Kandidat: transaksi rekening ini yang belum terpasang ke baris mana pun.
  const candidatesRaw = await db.transaction.findMany({
    where: { accountId: statement.accountId, deletedAt: null, bankStatementLine: null },
    select: { id: true, tanggal: true, tipe: true, jumlah: true, namaEntitas: true, catatan: true, tempatBeli: true },
  });
  const candidates: CandidateTx[] = candidatesRaw;
  const used = new Set<string>();

  // Hitung semua kandidat per baris, urutkan global menurun berdasarkan skor.
  type Pair = { lineId: string; txId: string; skor: number };
  const pairs: Pair[] = [];
  for (const line of statement.lines) {
    for (const tx of candidates) {
      const skor = scoreMatch(line, tx);
      if (skor >= SUGGEST_THRESHOLD) pairs.push({ lineId: line.id, txId: tx.id, skor });
    }
  }
  pairs.sort((a, b) => b.skor - a.skor);

  let auto = 0;
  let saran = 0;
  const doneLines = new Set<string>();
  for (const p of pairs) {
    if (doneLines.has(p.lineId) || used.has(p.txId)) continue;
    if (p.skor >= AUTO_MATCH_THRESHOLD) {
      await db.bankStatementLine.update({
        where: { id: p.lineId },
        data: { transactionId: p.txId, status: "cocok", skorCocok: p.skor },
      });
      used.add(p.txId);
      doneLines.add(p.lineId);
      auto++;
    } else {
      // simpan skor saran tertinggi (tanpa mengikat transaksi)
      const line = statement.lines.find((l) => l.id === p.lineId);
      if (line && (line.skorCocok ?? 0) < p.skor) {
        await db.bankStatementLine.update({ where: { id: p.lineId }, data: { skorCocok: p.skor } });
      }
      saran++;
    }
  }
  return { auto, saran };
}
