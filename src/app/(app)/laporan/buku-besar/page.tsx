import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getGeneralLedger } from "@/lib/reports";
import { formatRupiah, formatTanggalPendek } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BukuBesarPage({ searchParams }: { searchParams: Promise<{ coa?: string; tahun?: string }> }) {
  const sp = await searchParams;
  const tahun = sp.tahun ? Number(sp.tahun) : new Date().getFullYear();
  const start = new Date(tahun, 0, 1);
  const end = new Date(tahun, 11, 31, 23, 59, 59);

  // Akun yang memiliki mutasi (untuk selector)
  const withLines = await prisma.journalLine.groupBy({ by: ["coaId"], _count: { coaId: true } });
  const coaIds = withLines.map((g) => g.coaId);
  const akunOptions = await prisma.chartOfAccount.findMany({
    where: { id: { in: coaIds } },
    orderBy: { kode: "asc" },
    select: { id: true, kode: true, nama: true },
  });

  const selectedId = sp.coa || akunOptions[0]?.id;
  const ledger = selectedId ? await getGeneralLedger(selectedId, start, end) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold text-white">Buku Besar (General Ledger)</h2>
          <p className="text-xs text-slate-500">Mutasi & saldo berjalan per akun · tahun {tahun}.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <Link href="/laporan/neraca" className="btn-ghost">Neraca</Link>
          <Link href="/laporan/neraca-saldo" className="btn-ghost">Neraca Saldo</Link>
        </div>
      </div>

      {/* Selector akun */}
      <div className="flex gap-1 flex-wrap text-xs max-h-32 overflow-y-auto">
        {akunOptions.map((a) => (
          <Link key={a.id} href={`/laporan/buku-besar?coa=${a.id}`} className={`px-2.5 py-1.5 rounded-lg border ${selectedId === a.id ? "bg-ink-800 border-white/20 text-white" : "border-white/5 text-slate-400"}`}>
            <span className="text-slate-600 mr-1">{a.kode}</span>{a.nama}
          </Link>
        ))}
        {akunOptions.length === 0 && <p className="text-slate-500">Belum ada jurnal.</p>}
      </div>

      {ledger && (
        <div className="card p-0 overflow-x-auto">
          <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
            <p className="card-title">{ledger.coa.kode} · {ledger.coa.nama}</p>
            <p className="text-xs text-slate-500">Saldo akhir: <span className="text-white tabular-nums">{formatRupiah(ledger.saldoAkhir)}</span></p>
          </div>
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-[11px] uppercase text-slate-500">
                <th className="px-4 py-2 font-semibold">Tgl</th>
                <th className="px-4 py-2 font-semibold">No. Jurnal</th>
                <th className="px-4 py-2 font-semibold">Keterangan</th>
                <th className="px-4 py-2 font-semibold text-right">Debit</th>
                <th className="px-4 py-2 font-semibold text-right">Kredit</th>
                <th className="px-4 py-2 font-semibold text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-white/5 text-slate-400">
                <td className="px-4 py-2" colSpan={5}>Saldo Awal</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatRupiah(ledger.saldoAwal)}</td>
              </tr>
              {ledger.mutasi.map((m, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="px-4 py-2 text-slate-400 tabular-nums">{formatTanggalPendek(m.tanggal)}</td>
                  <td className="px-4 py-2 text-slate-500 tabular-nums text-xs">{m.nomor}</td>
                  <td className="px-4 py-2 text-slate-300">{m.deskripsi}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-200">{m.debit ? formatRupiah(m.debit) : "-"}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-200">{m.kredit ? formatRupiah(m.kredit) : "-"}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-100">{formatRupiah(m.saldo)}</td>
                </tr>
              ))}
              <tr className="border-t border-white/10 font-semibold bg-ink-800/40">
                <td className="px-4 py-2 text-slate-100" colSpan={3}>Total Mutasi</td>
                <td className="px-4 py-2 text-right tabular-nums text-white">{formatRupiah(ledger.totalDebit)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-white">{formatRupiah(ledger.totalKredit)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-white">{formatRupiah(ledger.saldoAkhir)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
