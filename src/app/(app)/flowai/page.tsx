import { getDashboardData } from "@/lib/dashboard";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FlowAIPage() {
  const d = await getDashboardData("ini");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-white">🤖 FlowAI Insight</h2>
        <p className="text-xs text-slate-500">Analisa otomatis berbasis data keuangan bulan ini.</p>
      </div>

      <div className="card">
        <p className="card-title mb-3">Insight</p>
        <ul className="space-y-3">
          {d.insights.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-200 bg-ink-800 rounded-lg px-3 py-2.5">
              <span className="text-brand-green">▹</span>
              <span>{s}</span>
            </li>
          ))}
          {d.insights.length === 0 && <li className="text-sm text-slate-500">Belum ada insight.</li>}
        </ul>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card">
          <p className="card-title">Rasio Laba</p>
          <p className="mt-2 text-lg font-bold text-white">{d.kpi.rasioLaba.toFixed(1)}%</p>
        </div>
        <div className="card">
          <p className="card-title">Skor Kesehatan</p>
          <p className="mt-2 text-lg font-bold text-white">{d.kpi.skor} · {d.kpi.statusLabel}</p>
        </div>
        <div className="card">
          <p className="card-title">Piutang Tertunda</p>
          <p className="mt-2 text-lg font-bold text-brand-green">{formatRupiah(d.totalPiutang)}</p>
        </div>
      </div>

      <div className="card">
        <p className="card-title mb-2">Konfigurasi (FlowAI Config)</p>
        <p className="text-sm text-slate-400">
          Ambang batas insight & preferensi tampilan akan dapat diatur di sini. Integrasi narasi berbasis LLM direncanakan pada fase lanjutan.
        </p>
      </div>
    </div>
  );
}
