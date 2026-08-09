import Link from "next/link";
import { getDashboardData } from "@/lib/dashboard";
import { formatRupiah, namaBulan } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LaporanPage() {
  const d = await getDashboardData("ini");

  const totalIncome = d.tren.reduce((s, r) => s + r.income, 0);
  const totalExpense = d.tren.reduce((s, r) => s + r.expense, 0);
  const totalProfit = totalIncome - totalExpense;

  // Pajak (estimasi dari periode aktif)
  const pphFinal = Math.round(d.kpi.income * 0.005);
  const pajakDaerahBulan = Math.round((d.rincianPemasukan.find((r) => r.nama === "Rental")?.nilai ?? 0) / 1.1 * 0.1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold text-white">Laporan Keuangan</h2>
          <p className="text-xs text-slate-500">Laba rugi, kategori, & pajak — tahun {d.tahun}.</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/laporan/export?periode=ini" className="btn-ghost text-xs">⬇️ Ekspor Excel</a>
          <Link href="/cetak/laporan?periode=ini" className="btn-primary text-xs">🖨️ Cetak / PDF</Link>
        </div>
      </div>

      {/* Laporan akuntansi double-entry (Fase 7) */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/laporan/neraca" className="btn-ghost text-xs">⚖️ Neraca</Link>
        <Link href="/laporan/neraca-saldo" className="btn-ghost text-xs">🧾 Neraca Saldo</Link>
        <Link href="/laporan/buku-besar" className="btn-ghost text-xs">📚 Buku Besar</Link>
        <Link href="/laporan/per-unit" className="btn-ghost text-xs">🏢 Laba Rugi per Unit</Link>
      </div>

      {/* P&L per bulan */}
      <div className="card p-0 overflow-x-auto">
        <div className="px-4 py-3 border-b border-white/5"><p className="card-title">Laba Rugi per Bulan</p></div>
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="text-left text-[11px] uppercase text-slate-500">
              <th className="px-4 py-2 font-semibold">Bulan</th>
              <th className="px-4 py-2 font-semibold text-right">Pemasukan</th>
              <th className="px-4 py-2 font-semibold text-right">Pengeluaran</th>
              <th className="px-4 py-2 font-semibold text-right">Profit</th>
            </tr>
          </thead>
          <tbody>
            {d.tren.map((r) => (
              <tr key={r.bulan} className="border-t border-white/5">
                <td className="px-4 py-3 text-slate-200">{namaBulan(r.bulan, true)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-brand-green">{formatRupiah(r.income)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-brand-red">{formatRupiah(r.expense)}</td>
                <td className={`px-4 py-3 text-right tabular-nums ${r.profit >= 0 ? "text-brand-green" : "text-brand-red"}`}>{formatRupiah(r.profit)}</td>
              </tr>
            ))}
            <tr className="border-t border-white/10 font-semibold bg-ink-800/40">
              <td className="px-4 py-3 text-slate-100">Total</td>
              <td className="px-4 py-3 text-right tabular-nums text-brand-green">{formatRupiah(totalIncome)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-brand-red">{formatRupiah(totalExpense)}</td>
              <td className={`px-4 py-3 text-right tabular-nums ${totalProfit >= 0 ? "text-brand-green" : "text-brand-red"}`}>{formatRupiah(totalProfit)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Kategori Pemasukan */}
        <div className="card">
          <p className="card-title mb-3">Pemasukan per Kategori (bulan ini)</p>
          <ul className="space-y-2">
            {d.rincianPemasukan.map((r) => (
              <li key={r.nama} className="flex justify-between text-sm">
                <span className="text-slate-300">{r.nama}</span>
                <span className="tabular-nums text-slate-200">{formatRupiah(r.nilai)} <span className="text-slate-500 text-xs">({r.persen.toFixed(1)}%)</span></span>
              </li>
            ))}
            {d.rincianPemasukan.length === 0 && <li className="text-sm text-slate-500">Belum ada data.</li>}
          </ul>
        </div>

        {/* Kategori Pengeluaran */}
        <div className="card">
          <p className="card-title mb-3">Pengeluaran per Kategori (bulan ini)</p>
          <ul className="space-y-2">
            {d.rincianPengeluaran.map((r) => (
              <li key={r.nama} className="flex justify-between text-sm">
                <span className="text-slate-300">{r.nama}</span>
                <span className="tabular-nums text-slate-200">{formatRupiah(r.nilai)} <span className="text-slate-500 text-xs">({r.persen.toFixed(1)}%)</span></span>
              </li>
            ))}
            {d.rincianPengeluaran.length === 0 && <li className="text-sm text-slate-500">Belum ada data.</li>}
          </ul>
        </div>
      </div>

      {/* Pajak */}
      <div className="card">
        <p className="card-title mb-3">Estimasi Pajak (bulan ini)</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg bg-ink-800 p-3">
            <p className="text-slate-400 text-xs">PPh Final 0,5%</p>
            <p className="mt-1 text-base font-bold text-white tabular-nums">{formatRupiah(pphFinal)}</p>
          </div>
          <div className="rounded-lg bg-ink-800 p-3">
            <p className="text-slate-400 text-xs">Pajak Daerah 10% (Rental)</p>
            <p className="mt-1 text-base font-bold text-white tabular-nums">{formatRupiah(pajakDaerahBulan)}</p>
          </div>
          <div className="rounded-lg bg-ink-800 p-3">
            <p className="text-slate-400 text-xs">Total Estimasi Pajak</p>
            <p className="mt-1 text-base font-bold text-brand-amber tabular-nums">{formatRupiah(pphFinal + pajakDaerahBulan)}</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-600 mt-3">* Ekspor PDF/Excel akan tersedia pada Fase 3.</p>
      </div>
    </div>
  );
}
