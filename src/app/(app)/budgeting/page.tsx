import { getDashboardData, rangeBulan } from "@/lib/dashboard";
import { getBudgetComparison } from "@/lib/budget";
import { formatRupiah, formatPercent } from "@/lib/format";
import BudgetTable from "@/components/BudgetTable";

export const dynamic = "force-dynamic";

export default async function BudgetingPage() {
  const [d, budget] = await Promise.all([getDashboardData("ini"), getBudgetComparison("ini")]);
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

      {/* Ringkasan anggaran */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card">
          <p className="card-title">Total Anggaran</p>
          <p className="mt-2 text-lg font-bold text-white tabular-nums">{formatRupiah(budget.totalBudget)}</p>
        </div>
        <div className="card">
          <p className="card-title">Total Realisasi</p>
          <p className="mt-2 text-lg font-bold text-brand-amber tabular-nums">{formatRupiah(budget.totalRealisasi)}</p>
          <p className="text-[11px] text-slate-500">
            {budget.totalBudget > 0 ? formatPercent((budget.totalRealisasi / budget.totalBudget) * 100) : "-"} terpakai
          </p>
        </div>
        <div className="card">
          <p className="card-title">Over-Budget</p>
          <p className={`mt-2 text-lg font-bold tabular-nums ${budget.overCount > 0 ? "text-brand-red" : "text-brand-green"}`}>
            {budget.overCount} kategori
          </p>
        </div>
      </div>

      {/* Tabel anggaran vs realisasi (editable) */}
      <BudgetTable rows={budget.rows} periode={budget.periode} />
    </div>
  );
}
