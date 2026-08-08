import Link from "next/link";
import { getDashboardData, rangeBulan, type Periode } from "@/lib/dashboard";
import { getBudgetComparison } from "@/lib/budget";
import { formatRupiah, namaBulan } from "@/lib/format";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function CetakLaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const sp = await searchParams;
  const periode: Periode = sp.periode === "lalu" ? "lalu" : "ini";
  const { bulan, tahun } = rangeBulan(periode);
  const [d, budget] = await Promise.all([getDashboardData(periode), getBudgetComparison(periode)]);

  const totIn = d.tren.reduce((s, r) => s + r.income, 0);
  const totOut = d.tren.reduce((s, r) => s + r.expense, 0);
  const pphFinal = Math.round(d.kpi.income * 0.005);
  const pajakDaerah = Math.round((d.rincianPemasukan.find((r) => r.nama === "Rental")?.nilai ?? 0) / 1.1 * 0.1);

  return (
    <div className="min-h-screen bg-white text-slate-900 print:bg-white">
      <style>{`@media print { @page { margin: 16mm; } .no-print { display: none !important; } }`}</style>

      <div className="max-w-3xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6 no-print">
          <Link href="/laporan" className="text-sm text-slate-500 hover:text-slate-800">← Kembali</Link>
          <PrintButton />
        </div>

        <header className="border-b-2 border-slate-800 pb-3 mb-6">
          <h1 className="text-2xl font-bold">V3BKS Mini Soccer</h1>
          <p className="text-sm text-slate-600">Laporan Keuangan — {namaBulan(bulan, true)} {tahun}</p>
          <p className="text-xs text-slate-400 mt-1">Dicetak: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
        </header>

        {/* Ringkasan KPI */}
        <section className="grid grid-cols-3 gap-4 mb-6">
          <div><p className="text-xs text-slate-500">Pemasukan</p><p className="text-lg font-bold text-green-700">{formatRupiah(d.kpi.income)}</p></div>
          <div><p className="text-xs text-slate-500">Pengeluaran</p><p className="text-lg font-bold text-red-700">{formatRupiah(d.kpi.expense)}</p></div>
          <div><p className="text-xs text-slate-500">Profit</p><p className="text-lg font-bold">{formatRupiah(d.kpi.profit)}</p></div>
        </section>

        {/* P&L per bulan */}
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 mb-2">Laba Rugi per Bulan</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-left text-slate-500">
                <th className="py-1.5">Bulan</th>
                <th className="py-1.5 text-right">Pemasukan</th>
                <th className="py-1.5 text-right">Pengeluaran</th>
                <th className="py-1.5 text-right">Profit</th>
              </tr>
            </thead>
            <tbody>
              {d.tren.map((r) => (
                <tr key={r.bulan} className="border-b border-slate-100">
                  <td className="py-1.5">{namaBulan(r.bulan, true)}</td>
                  <td className="py-1.5 text-right">{formatRupiah(r.income)}</td>
                  <td className="py-1.5 text-right">{formatRupiah(r.expense)}</td>
                  <td className="py-1.5 text-right">{formatRupiah(r.profit)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-800 font-bold">
                <td className="py-1.5">Total</td>
                <td className="py-1.5 text-right">{formatRupiah(totIn)}</td>
                <td className="py-1.5 text-right">{formatRupiah(totOut)}</td>
                <td className="py-1.5 text-right">{formatRupiah(totIn - totOut)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Kategori */}
        <section className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 mb-2">Pemasukan / Kategori</h2>
            <table className="w-full text-sm">
              <tbody>
                {d.rincianPemasukan.map((r) => (
                  <tr key={r.nama} className="border-b border-slate-100">
                    <td className="py-1">{r.nama}</td>
                    <td className="py-1 text-right">{formatRupiah(r.nilai)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 mb-2">Pengeluaran / Kategori</h2>
            <table className="w-full text-sm">
              <tbody>
                {d.rincianPengeluaran.map((r) => (
                  <tr key={r.nama} className="border-b border-slate-100">
                    <td className="py-1">{r.nama}</td>
                    <td className="py-1 text-right">{formatRupiah(r.nilai)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pajak */}
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 mb-2">Estimasi Pajak</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-slate-100"><td className="py-1">PPh Final 0,5%</td><td className="py-1 text-right">{formatRupiah(pphFinal)}</td></tr>
              <tr className="border-b border-slate-100"><td className="py-1">Pajak Daerah 10% (Rental)</td><td className="py-1 text-right">{formatRupiah(pajakDaerah)}</td></tr>
              <tr className="font-bold border-t border-slate-800"><td className="py-1">Total</td><td className="py-1 text-right">{formatRupiah(pphFinal + pajakDaerah)}</td></tr>
            </tbody>
          </table>
        </section>

        {/* Anggaran */}
        {budget.rows.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 mb-2">Anggaran vs Realisasi</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-left text-slate-500">
                  <th className="py-1.5">Kategori</th>
                  <th className="py-1.5 text-right">Anggaran</th>
                  <th className="py-1.5 text-right">Realisasi</th>
                  <th className="py-1.5 text-right">Sisa</th>
                </tr>
              </thead>
              <tbody>
                {budget.rows.map((r) => (
                  <tr key={r.categoryId} className="border-b border-slate-100">
                    <td className="py-1.5">{r.nama}</td>
                    <td className="py-1.5 text-right">{formatRupiah(r.budget)}</td>
                    <td className="py-1.5 text-right">{formatRupiah(r.realisasi)}</td>
                    <td className="py-1.5 text-right">{formatRupiah(r.sisa)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <footer className="mt-8 pt-3 border-t border-slate-200 text-xs text-slate-400 text-center">
          V3BKS FinanceFlow · Dokumen dihasilkan otomatis
        </footer>
      </div>
    </div>
  );
}
