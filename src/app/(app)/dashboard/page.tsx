import { getDashboardData, type Periode } from "@/lib/dashboard";
import { formatRupiah, formatPercent, formatTanggalPendek, namaBulan } from "@/lib/format";
import ArusKasChart from "@/components/charts/ArusKasChart";
import DonutChart from "@/components/charts/DonutChart";
import TrenBulananChart from "@/components/charts/TrenBulananChart";

export const dynamic = "force-dynamic";

function KpiCard({
  title, value, sub, accent,
}: { title: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="card">
      <p className="card-title">{title}</p>
      <p className={`mt-2 text-xl font-bold tabular-nums ${accent ?? "text-white"}`}>{value}</p>
      {sub && <p className="mt-1 text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

function ProgressBar({ percent, color = "bg-brand-green" }: { percent: number; color?: string }) {
  return (
    <div className="w-full h-2 rounded-full bg-ink-700 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const sp = await searchParams;
  const periode: Periode = sp.periode === "lalu" ? "lalu" : "ini";
  const d = await getDashboardData(periode);
  const labelBulan = `${namaBulan(d.bulan, true)} ${d.tahun}`;
  const statusColor =
    d.kpi.statusLabel === "Healthy" ? "text-brand-green" : d.kpi.statusLabel === "Waspada" ? "text-brand-amber" : "text-brand-red";

  return (
    <div className="space-y-4">
      {/* ---- KPI Row ---- */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard title="Total Saldo" value={formatRupiah(d.kpi.totalSaldo)} sub={`Semua rekening`} />
        <KpiCard title="Pemasukan" value={formatRupiah(d.kpi.income)} sub={labelBulan} accent="text-brand-green" />
        <KpiCard title="Pengeluaran" value={formatRupiah(d.kpi.expense)} sub={labelBulan} accent="text-brand-red" />
        <KpiCard title="Rasio Laba" value={formatPercent(d.kpi.rasioLaba)} sub={`Profit ${formatRupiah(d.kpi.profit)}`} accent={d.kpi.profit >= 0 ? "text-brand-green" : "text-brand-red"} />
        <KpiCard title="Nilai Kekayaan" value={formatRupiah(d.kpi.nilaiKekayaan)} sub="Kas + piutang − tagihan" />
        <div className="card flex items-center justify-between">
          <div>
            <p className="card-title">Status</p>
            <p className={`mt-2 text-xl font-bold ${statusColor}`}>{d.kpi.skor}</p>
            <p className={`text-[11px] ${statusColor}`}>{d.kpi.statusLabel}</p>
          </div>
          <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center text-xs font-bold ${statusColor}`}
            style={{ borderColor: "currentColor" }}>
            {Math.round(d.kpi.skor)}
          </div>
        </div>
      </div>

      {/* ---- Row 1: Arus Kas + Rincian Pengeluaran ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <p className="card-title">Arus Kas ({labelBulan})</p>
            <div className="flex gap-3 text-[11px]">
              <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-brand-green inline-block" />Pemasukan</span>
              <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-brand-red inline-block" />Pengeluaran</span>
            </div>
          </div>
          <ArusKasChart data={d.arusKas} />
        </div>
        <div className="card">
          <p className="card-title mb-3">Rincian Pengeluaran</p>
          <DonutChart data={d.rincianPengeluaran} />
        </div>
      </div>

      {/* ---- Row 2: Tagihan Mendatang + Progres Target + FlowAI ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card">
          <p className="card-title mb-3">Tagihan Mendatang</p>
          <ul className="space-y-2">
            {d.tagihanMendatang.length === 0 && <li className="text-sm text-slate-500">Tidak ada tagihan.</li>}
            {d.tagihanMendatang.map((t, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="text-slate-200 truncate">{t.nama}</p>
                  <p className="text-[11px] text-slate-500">
                    {formatTanggalPendek(t.tanggal)} · {t.jenis === "piutang" ? "Piutang" : "Tagihan"}
                  </p>
                </div>
                <span className={`tabular-nums font-medium ${t.jenis === "piutang" ? "text-brand-green" : "text-brand-amber"}`}>
                  {formatRupiah(t.nominal)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <p className="card-title mb-3">Progres Target</p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Harian (tgl {d.progresTarget.harian.hari})</span>
                <span className="text-slate-300">{formatPercent(d.progresTarget.harian.persen)}</span>
              </div>
              <ProgressBar percent={d.progresTarget.harian.persen} />
              <p className="text-[11px] text-slate-500 mt-1">
                {formatRupiah(d.progresTarget.harian.realisasi)} / {formatRupiah(d.progresTarget.harian.target)}
              </p>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Bulanan</span>
                <span className="text-slate-300">{formatPercent(d.progresTarget.bulanan.persen)}</span>
              </div>
              <ProgressBar percent={d.progresTarget.bulanan.persen} color="bg-brand-blue" />
              <p className="text-[11px] text-slate-500 mt-1">
                {formatRupiah(d.progresTarget.bulanan.realisasi)} / {formatRupiah(d.progresTarget.bulanan.target)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <p className="card-title mb-3">🤖 FlowAI Insight</p>
          <ul className="space-y-2.5">
            {d.insights.map((s, i) => (
              <li key={i} className="text-xs text-slate-300 leading-relaxed flex gap-2">
                <span className="text-brand-green">▹</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ---- Row 3: Tren Bulanan + Total Tagihan + Saldo Akun ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-1">
          <p className="card-title mb-3">Total Tagihan</p>
          <p className="text-2xl font-bold text-brand-red tabular-nums">{formatRupiah(d.totalTagihan + d.totalPiutang)}</p>
          <p className="text-[11px] text-slate-500 mt-1">{d.jumlahTagihan} item pending</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Tagihan rutin</span>
              <span className="text-brand-amber tabular-nums">{formatRupiah(d.totalTagihan)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Piutang pelunasan</span>
              <span className="text-brand-green tabular-nums">{formatRupiah(d.totalPiutang)}</span>
            </div>
          </div>
        </div>

        <div className="card lg:col-span-1">
          <p className="card-title mb-3">Saldo Rekening</p>
          <ul className="space-y-2.5">
            {d.saldoPerAkun.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-7 h-7 rounded-lg bg-ink-700 flex items-center justify-center text-[11px]">
                    {a.tipe === "cash" ? "💵" : "🏦"}
                  </span>
                  {a.nama}
                </span>
                <span className="tabular-nums font-medium text-white">{formatRupiah(a.saldo)}</span>
              </li>
            ))}
            <li className="flex items-center justify-between text-sm pt-2 border-t border-white/5">
              <span className="text-slate-400 font-medium">Total</span>
              <span className="tabular-nums font-bold text-brand-green">{formatRupiah(d.kpi.totalSaldo)}</span>
            </li>
          </ul>
        </div>

        <div className="card lg:col-span-1">
          <p className="card-title mb-3">Tren Bulanan</p>
          <TrenBulananChart data={d.tren} />
        </div>
      </div>
    </div>
  );
}
