import { getDashboardData, rangeBulan } from "@/lib/dashboard";
import { formatRupiah, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BudgetingPage() {
  const d = await getDashboardData("ini");
  const { tahun, bulan } = rangeBulan("ini");
  const hariDalamBulan = new Date(tahun, bulan + 1, 0).getDate();
  const hariBerjalan = d.progresTarget.harian.hari || 1;

  // Proyeksi run-rate linier
  const proyeksiIncome = Math.round((d.kpi.income / hariBerjalan) * hariDalamBulan);
  const proyeksiExpense = Math.round((d.kpi.expense / hariBerjalan) * hariDalamBulan);
  const proyeksiProfit = proyeksiIncome - proyeksiExpense;
  const capaianTarget = d.progresTarget.bulanan.target > 0 ? (proyeksiIncome / d.progresTarget.bulanan.target) * 100 : 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-white">Budgeting & Prediksi</h2>
        <p className="text-xs text-slate-500">Proyeksi akhir bulan berbasis run-rate {hariBerjalan}/{hariDalamBulan} hari.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="card">
          <p className="card-title">Proyeksi Pemasukan</p>
          <p className="mt-2 text-lg font-bold text-brand-green tabular-nums">{formatRupiah(proyeksiIncome)}</p>
          <p className="text-[11px] text-slate-500">saat ini {formatRupiah(d.kpi.income)}</p>
        </div>
        <div className="card">
          <p className="card-title">Proyeksi Pengeluaran</p>
          <p className="mt-2 text-lg font-bold text-brand-red tabular-nums">{formatRupiah(proyeksiExpense)}</p>
          <p className="text-[11px] text-slate-500">saat ini {formatRupiah(d.kpi.expense)}</p>
        </div>
        <div className="card">
          <p className="card-title">Proyeksi Profit</p>
          <p className={`mt-2 text-lg font-bold tabular-nums ${proyeksiProfit >= 0 ? "text-brand-green" : "text-brand-red"}`}>{formatRupiah(proyeksiProfit)}</p>
        </div>
        <div className="card">
          <p className="card-title">Proyeksi vs Target</p>
          <p className="mt-2 text-lg font-bold text-brand-blue tabular-nums">{formatPercent(capaianTarget)}</p>
          <p className="text-[11px] text-slate-500">target {formatRupiah(d.progresTarget.bulanan.target)}</p>
        </div>
      </div>

      <div className="card">
        <p className="card-title mb-3">Realisasi Pengeluaran per Kategori (bulan ini)</p>
        <ul className="space-y-3">
          {d.rincianPengeluaran.map((r) => (
            <li key={r.nama}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">{r.nama}</span>
                <span className="tabular-nums text-slate-200">{formatRupiah(r.nilai)}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-ink-700 overflow-hidden">
                <div className="h-full bg-brand-amber" style={{ width: `${Math.min(100, r.persen)}%` }} />
              </div>
            </li>
          ))}
          {d.rincianPengeluaran.length === 0 && <li className="text-sm text-slate-500">Belum ada pengeluaran.</li>}
        </ul>
        <p className="text-[11px] text-slate-600 mt-4">* Penetapan budget per kategori & alert overspend menyusul (Fase 3).</p>
      </div>
    </div>
  );
}
