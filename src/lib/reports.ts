// -----------------------------------------------------------------------------
// F-01 · Laporan berbasis jurnal — Neraca Saldo, Neraca, Buku Besar
// F-07 · Laba Rugi per Unit Bisnis
// -----------------------------------------------------------------------------
import { prisma } from "@/lib/prisma";
import type { CoaTipe } from "@/lib/coa";

type CoaMeta = { id: string; kode: string; nama: string; tipe: string; subTipe: string | null; saldoNormal: string };

export type TrialBalanceRow = CoaMeta & { debit: number; kredit: number; saldo: number };

/** Filter jurnal berdasarkan tanggal (<= asOf) & unit bisnis (opsional). */
function entryFilter(asOf?: Date, buId?: string) {
  const f: Record<string, unknown> = {};
  if (asOf) f.tanggal = { lte: asOf };
  if (buId) f.businessUnitId = buId;
  return f;
}

async function coaList(): Promise<CoaMeta[]> {
  return prisma.chartOfAccount.findMany({
    orderBy: { kode: "asc" },
    select: { id: true, kode: true, nama: true, tipe: true, subTipe: true, saldoNormal: true },
  });
}

/**
 * Neraca Saldo (Trial Balance) — per akun postable yang punya mutasi.
 * `debit`/`kredit` = kolom penyajian; `saldo` = saldo bertanda sesuai saldoNormal.
 */
export async function getTrialBalance(asOf?: Date, buId?: string) {
  const [coas, grouped] = await Promise.all([
    coaList(),
    prisma.journalLine.groupBy({
      by: ["coaId"],
      where: { entry: entryFilter(asOf, buId) },
      _sum: { debit: true, kredit: true },
    }),
  ]);
  const sumByCoa = new Map(grouped.map((g) => [g.coaId, { debit: g._sum.debit ?? 0, kredit: g._sum.kredit ?? 0 }]));

  const rows: TrialBalanceRow[] = [];
  let totalDebit = 0;
  let totalKredit = 0;
  for (const c of coas) {
    const s = sumByCoa.get(c.id);
    if (!s) continue; // hanya akun bermutasi
    const net = s.debit - s.kredit; // >0 saldo debit, <0 saldo kredit
    const debitCol = net > 0 ? net : 0;
    const kreditCol = net < 0 ? -net : 0;
    totalDebit += debitCol;
    totalKredit += kreditCol;
    const saldo = c.saldoNormal === "debit" ? net : -net;
    rows.push({ ...c, debit: debitCol, kredit: kreditCol, saldo });
  }
  const selisih = Math.round((totalDebit - totalKredit) * 100) / 100;
  return { rows, totalDebit, totalKredit, selisih, seimbang: Math.abs(selisih) <= 1 };
}

export type NeracaSection = { judul: string; akun: { kode: string; nama: string; saldo: number }[]; total: number };

/**
 * Neraca (Balance Sheet) per tanggal. Karena belum ada jurnal penutup, laba
 * berjalan dihitung dari akun nominal dan dimasukkan ke ekuitas agar
 * Aset = Kewajiban + Ekuitas.
 */
export async function getBalanceSheet(asOf?: Date, buId?: string) {
  const { rows } = await getTrialBalance(asOf, buId);
  const byTipe = (t: CoaTipe) => rows.filter((r) => r.tipe === t);

  const aset = byTipe("ASET").map((r) => ({ kode: r.kode, nama: r.nama, saldo: r.debit - r.kredit }));
  const kewajiban = byTipe("KEWAJIBAN").map((r) => ({ kode: r.kode, nama: r.nama, saldo: r.kredit - r.debit }));
  const ekuitas = byTipe("EKUITAS").map((r) => ({ kode: r.kode, nama: r.nama, saldo: r.kredit - r.debit }));

  const totalAset = aset.reduce((s, a) => s + a.saldo, 0);
  const totalKewajiban = kewajiban.reduce((s, a) => s + a.saldo, 0);
  const totalEkuitasAkun = ekuitas.reduce((s, a) => s + a.saldo, 0);

  const pendapatan = rows.filter((r) => r.tipe === "PENDAPATAN").reduce((s, r) => s + (r.kredit - r.debit), 0);
  const bebanHpp = rows.filter((r) => r.tipe === "BEBAN" || r.tipe === "HPP").reduce((s, r) => s + (r.debit - r.kredit), 0);
  const labaBerjalan = pendapatan - bebanHpp;

  const ekuitasPlus = [...ekuitas, { kode: "—", nama: "Laba (Rugi) Tahun Berjalan", saldo: labaBerjalan }];
  const totalEkuitas = totalEkuitasAkun + labaBerjalan;

  return {
    aset: { judul: "ASET", akun: aset, total: totalAset } as NeracaSection,
    kewajiban: { judul: "KEWAJIBAN", akun: kewajiban, total: totalKewajiban } as NeracaSection,
    ekuitas: { judul: "EKUITAS", akun: ekuitasPlus, total: totalEkuitas } as NeracaSection,
    totalAset,
    totalPasiva: totalKewajiban + totalEkuitas,
    labaBerjalan,
    seimbang: Math.abs(totalAset - (totalKewajiban + totalEkuitas)) <= 1,
  };
}

/** Buku Besar (General Ledger) satu akun: saldo awal + mutasi + saldo berjalan. */
export async function getGeneralLedger(coaId: string, start: Date, end: Date, buId?: string) {
  const coa = await prisma.chartOfAccount.findUnique({ where: { id: coaId } });
  if (!coa) return null;

  const openAgg = await prisma.journalLine.aggregate({
    where: { coaId, entry: { tanggal: { lt: start }, ...(buId ? { businessUnitId: buId } : {}) } },
    _sum: { debit: true, kredit: true },
  });
  const openNet = (openAgg._sum.debit ?? 0) - (openAgg._sum.kredit ?? 0);
  const saldoAwal = coa.saldoNormal === "debit" ? openNet : -openNet;

  const lines = await prisma.journalLine.findMany({
    where: { coaId, entry: { tanggal: { gte: start, lte: end }, ...(buId ? { businessUnitId: buId } : {}) } },
    include: { entry: { select: { nomor: true, tanggal: true, deskripsi: true } } },
    orderBy: [{ entry: { tanggal: "asc" } }, { entry: { nomor: "asc" } }],
  });

  let saldo = saldoAwal;
  const mutasi = lines.map((l) => {
    const delta = coa.saldoNormal === "debit" ? l.debit - l.kredit : l.kredit - l.debit;
    saldo += delta;
    return {
      nomor: l.entry.nomor,
      tanggal: l.entry.tanggal,
      deskripsi: l.memo || l.entry.deskripsi,
      debit: l.debit,
      kredit: l.kredit,
      saldo,
    };
  });
  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalKredit = lines.reduce((s, l) => s + l.kredit, 0);
  return { coa, saldoAwal, mutasi, saldoAkhir: saldo, totalDebit, totalKredit };
}

/** Laba Rugi ringkas per Unit Bisnis (F-07) dari jurnal, rentang tanggal. */
export async function getProfitPerUnit(start: Date, end: Date) {
  const [units, lines] = await Promise.all([
    prisma.businessUnit.findMany({ where: { isActive: true }, orderBy: { urutan: "asc" } }),
    prisma.journalLine.findMany({
      where: { entry: { tanggal: { gte: start, lte: end } }, coa: { tipe: { in: ["PENDAPATAN", "BEBAN", "HPP"] } } },
      select: { debit: true, kredit: true, coa: { select: { tipe: true } }, entry: { select: { businessUnitId: true } } },
    }),
  ]);

  type Row = { pendapatan: number; hpp: number; beban: number };
  const acc = new Map<string, Row>();
  const keyFor = (id: string | null) => id ?? "_none";
  const ensure = (id: string | null) => {
    const k = keyFor(id);
    if (!acc.has(k)) acc.set(k, { pendapatan: 0, hpp: 0, beban: 0 });
    return acc.get(k)!;
  };
  for (const l of lines) {
    const r = ensure(l.entry.businessUnitId);
    if (l.coa.tipe === "PENDAPATAN") r.pendapatan += l.kredit - l.debit;
    else if (l.coa.tipe === "HPP") r.hpp += l.debit - l.kredit;
    else r.beban += l.debit - l.kredit;
  }

  const rows = units.map((u) => {
    const r = acc.get(u.id) ?? { pendapatan: 0, hpp: 0, beban: 0 };
    const laba = r.pendapatan - r.hpp - r.beban;
    return { unit: u, ...r, laba };
  });
  // Unit yang belum tertaut (mestinya kosong setelah backfill)
  const tanpaUnit = acc.get("_none");
  const total = rows.reduce(
    (s, r) => ({
      pendapatan: s.pendapatan + r.pendapatan,
      hpp: s.hpp + r.hpp,
      beban: s.beban + r.beban,
      laba: s.laba + r.laba,
    }),
    { pendapatan: 0, hpp: 0, beban: 0, laba: 0 }
  );
  return { rows, tanpaUnit, total };
}
