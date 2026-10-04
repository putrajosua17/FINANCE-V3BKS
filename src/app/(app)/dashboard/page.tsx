import { getDashboardData, type Periode } from "@/lib/dashboard";
import { formatRupiah, formatPercent, formatTanggalPendek, namaBulan } from "@/lib/format";
import ArusKasChart from "@/components/charts/ArusKasChart";
import DonutChart from "@/components/charts/DonutChart";
import TrenBulananChart from "@/components/charts/TrenBulananChart";
import Link from "next/link";

export const dynamic = "force-dynamic";

function KpiCard({
  title, value, sub, accent,
}: { title: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="card card-hover min-h-[126px]">
      <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-brand-green/[0.035] blur-2xl" />
      <p className="card-title">{title}</p>
      <p className={`metric-value ${accent ?? "text-white"}`}>{value}</p>
      {sub && <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{sub}</p>}
    </div>
  );
}

function ProgressBar({ percent, color = "bg-brand-green" }: { percent: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full border border-white/[0.04] bg-black/25">
      <div className={`h-full rounded-full ${color} shadow-[0_0_12px_rgba(34,197,94,.25)]`} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
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
    <div className="space-y-4 sm:space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[linear-gradient(120deg,rgba(34,197,94,.09),rgba(255,255,255,.018)_42%,rgba(217,255,85,.035))] p-5 sm:p-6 lg:p-7">
        <div className="absolute -right-14 -top-20 h-52 w-52 rounded-full border border-brand-green/10" />
        <div className="absolute -right-2 -top-8 h-36 w-36 rounded-full border border-white/[0.05]" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="eyebrow">V3BKS Command Center</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl lg:text-4xl">
              Keuangan dan operasional dalam satu tampilan.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
              Ringkasan {labelBulan} untuk memantau saldo, arus kas, target, tagihan, dan kesiapan data sebelum pengambilan keputusan.
            </p>
          </div>
          <div className="glass-strip flex w-full flex-col gap-3 p-3 sm:w-auto sm:min-w-[260px]">
            <div className="flex items-center justify-between gap-5">
              <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">System status</span>
              <span className={`flex items-center gap-2 text-xs font-semibold ${statusColor}`}>
                <i className="h-2 w-2 rounded-full bg-current shadow-[0_0_12px_currentColor]" />
                {d.kpi.statusLabel}
              </span>
            </div>
            <div className="section-line pt-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Financial health score</p>
              <div className="mt-1 flex items-end justify-between">
                <p className={`text-3xl font-semibold tabular-nums ${statusColor}`}>{Math.round(d.kpi.skor)}</p>
                <p className="pb-1 text-[10px] text-slate-600">/ 100</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard title="Total Saldo" value={formatRupiah(d.kpi.totalSaldo)} sub="Semua rekening" />
        <KpiCard title="Pemasukan" value={formatRupiah(d.kpi.income)} sub={labelBulan} accent="text-brand-green" />
        <KpiCard title="Pengeluaran" value={formatRupiah(d.kpi.expense)} sub={labelBulan} accent="text-brand-red" />
        <KpiCard title="Rasio Arus Kas Bersih" value={formatPercent(d.kpi.rasioLaba)} sub={`Arus kas bersih ${formatRupiah(d.kpi.profit)}`} accent={d.kpi.profit >= 0 ? "text-brand-green" : "text-brand-red"} />
        <KpiCard title="Nilai Kekayaan" value={formatRupiah(d.kpi.nilaiKekayaan)} sub="Kas + piutang − tagihan" />
        <div className="card card-hover flex min-h-[126px] items-center justify-between">
          <div>
            <p className="card-title">Status</p>
            <p className={`metric-value ${statusColor}`}>{d.kpi.skor}</p>
            <p className={`mt-1 text-[11px] ${statusColor}`}>{d.kpi.statusLabel}</p>
          </div>
          <div className={`relative grid h-14 w-14 place-items-center rounded-full border text-xs font-bold ${statusColor}`} style={{ borderColor: "currentColor" }}>
            <span className="absolute inset-1 rounded-full border border-current opacity-20" />
            {Math.round(d.kpi.skor)}
          </div>
        </div>
      </div>

      {d.integritas.bermasalah && (
        <div className="card border-brand-amber/25 bg-brand-amber/[0.035]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-amber">Data keuangan belum siap dijadikan saldo final</p>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                {d.integritas.tanpaJurnal > 0 && <span>{d.integritas.tanpaJurnal} transaksi belum berjurnal</span>}
                {d.integritas.barisBankBelum > 0 && <span>{d.integritas.barisBankBelum} mutasi bank belum cocok</span>}
                {d.integritas.rekonsiliasiTerbuka > 0 && <span>{d.integritas.rekonsiliasiTerbuka} rekonsiliasi belum selesai</span>}
                {d.integritas.rekeningNegatif.length > 0 && <span>Saldo negatif: {d.integritas.rekeningNegatif.join(", ")}</span>}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              {d.integritas.tanpaJurnal > 0 && <Link href="/tutup-buku" className="btn-ghost text-xs">Perbaiki Jurnal</Link>}
              <Link href="/rekonsiliasi" className="btn-primary text-xs">Buka Rekonsiliasi</Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="eyebrow">Cash movement</span>
              <p className="mt-2 text-sm font-medium text-white">Arus Kas · {labelBulan}</p>
            </div>
            <div className="flex gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-full bg-brand-green shadow-[0_0_8px_rgba(34,197,94,.6)]" />Pemasukan</span>
              <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-full bg-brand-red" />Pengeluaran</span>
            </div>
          </div>
          <ArusKasChart data={d.arusKas} />
        </div>
        <div className="card">
          <span className="eyebrow">Expense mix</span>
          <p className="mb-3 mt-2 text-sm font-medium text-white">Rincian Pengeluaran</p>
          <DonutChart data={d.rincianPengeluaran} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card card-hover">
          <span className="eyebrow">Upcoming</span>
          <p className="mb-3 mt-2 text-sm font-medium text-white">Tagihan Mendatang</p>
          <ul className="space-y-2">
            {d.tagihanMendatang.length === 0 && <li className="text-sm text-slate-500">Tidak ada tagihan.</li>}
            {d.tagihanMendatang.map((t, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.045] bg-white/[0.018] p-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-slate-200">{t.nama}</p>
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

        <div className="card card-hover">
          <span className="eyebrow">Performance</span>
          <p className="mb-4 mt-2 text-sm font-medium text-white">Progres Target</p>
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-slate-400">Harian (tgl {d.progresTarget.harian.hari})</span>
                <span className="text-slate-300">{formatPercent(d.progresTarget.harian.persen)}</span>
              </div>
              <ProgressBar percent={d.progresTarget.harian.persen} />
              <p className="mt-2 text-[11px] text-slate-500">
                {formatRupiah(d.progresTarget.harian.realisasi)} / {formatRupiah(d.progresTarget.harian.target)}
              </p>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-slate-400">Bulanan</span>
                <span className="text-slate-300">{formatPercent(d.progresTarget.bulanan.persen)}</span>
              </div>
              <ProgressBar percent={d.progresTarget.bulanan.persen} color="bg-brand-blue" />
              <p className="mt-2 text-[11px] text-slate-500">
                {formatRupiah(d.progresTarget.bulanan.realisasi)} / {formatRupiah(d.progresTarget.bulanan.target)}
              </p>
            </div>
          </div>
        </div>

        <div className="card card-hover border-brand-green/[0.09]">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Intelligence</span>
            <span className="rounded-full border border-brand-green/15 bg-brand-green/[0.06] px-2 py-1 text-[9px] uppercase tracking-[0.15em] text-brand-green">FlowAI</span>
          </div>
          <p className="mb-3 mt-2 text-sm font-medium text-white">Insight Prioritas</p>
          <ul className="space-y-2.5">
            {d.insights.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-slate-300">
                <span className="mt-1 text-brand-green">▹</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card card-hover">
          <span className="eyebrow">Obligations</span>
          <p className="mb-1 mt-2 text-sm font-medium text-white">Total Tagihan</p>
          <p className="text-2xl font-semibold tracking-tight text-brand-red tabular-nums">{formatRupiah(d.totalTagihan + d.totalPiutang)}</p>
          <p className="mt-1 text-[11px] text-slate-500">{d.jumlahTagihan} item pending</p>
          <div className="mt-4 space-y-2.5 border-t border-white/[0.05] pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Tagihan rutin</span>
              <span className="text-brand-amber tabular-nums">{formatRupiah(d.totalTagihan)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Piutang pelunasan</span>
              <span className="text-brand-green tabular-nums">{formatRupiah(d.totalPiutang)}</span>
            </div>
          </div>
        </div>

        <div className="card card-hover">
          <span className="eyebrow">Treasury</span>
          <p className="mb-3 mt-2 text-sm font-medium text-white">Saldo Rekening</p>
          <ul className="space-y-2.5">
            {d.saldoPerAkun.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-slate-300">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.05] bg-white/[0.025] text-[11px]">
                    {a.tipe === "cash" ? "💵" : "🏦"}
                  </span>
                  <span className="truncate">{a.nama}</span>
                </span>
                <span className={`tabular-nums font-medium ${a.saldo < 0 ? "text-brand-red" : "text-white"}`}>{formatRupiah(a.saldo)}</span>
              </li>
            ))}
            <li className="flex items-center justify-between border-t border-white/[0.05] pt-3 text-sm">
              <span className="font-medium text-slate-400">Total</span>
              <span className="font-bold text-brand-green tabular-nums">{formatRupiah(d.kpi.totalSaldo)}</span>
            </li>
          </ul>
        </div>

        <div className="card">
          <span className="eyebrow">Trend</span>
          <p className="mb-3 mt-2 text-sm font-medium text-white">Tren Bulanan</p>
          <TrenBulananChart data={d.tren} />
        </div>
      </div>
    </div>
  );
}
