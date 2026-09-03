import Link from "next/link";
import { getProfitPerUnit } from "@/lib/reports";
import { rangeBulan } from "@/lib/dashboard";
import { formatRupiah, namaBulan } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PerUnitPage({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  const sp = await searchParams;
  const periode = sp.periode === "lalu" ? "lalu" : "ini";
  const { start, end, bulan, tahun } = rangeBulan(periode);
  // getProfitPerUnit inklusif pada `end`; kurangi 1 ms agar tidak bocor ke bulan berikutnya.
  const endInclusive = new Date(end.getTime() - 1);
  const { rows, total } = await getProfitPerUnit(start, endInclusive);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold text-white">Laba Rugi per Unit Bisnis</h2>
          <p className="text-xs text-slate-500">Unit mana yang menopang & membebani · {namaBulan(bulan, true)} {tahun}.</p>
        </div>
        <div className="flex gap-1 text-xs">
          <Link href="/laporan/per-unit?periode=ini" className={`px-3 py-1.5 rounded-lg border ${periode === "ini" ? "bg-ink-800 border-white/20 text-white" : "border-white/5 text-slate-400"}`}>Bulan Ini</Link>
          <Link href="/laporan/per-unit?periode=lalu" className={`px-3 py-1.5 rounded-lg border ${periode === "lalu" ? "bg-ink-800 border-white/20 text-white" : "border-white/5 text-slate-400"}`}>Bulan Lalu</Link>
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-[11px] uppercase text-slate-500">
              <th className="px-4 py-2 font-semibold">Unit</th>
              <th className="px-4 py-2 font-semibold">Induk</th>
              <th className="px-4 py-2 font-semibold text-right">Pendapatan</th>
              <th className="px-4 py-2 font-semibold text-right">HPP</th>
              <th className="px-4 py-2 font-semibold text-right">Beban</th>
              <th className="px-4 py-2 font-semibold text-right">Laba/Rugi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.unit.id} className="border-t border-white/5">
                <td className="px-4 py-2 text-slate-200">{r.unit.nama}</td>
                <td className="px-4 py-2 text-slate-500">{r.unit.induk}</td>
                <td className="px-4 py-2 text-right tabular-nums text-brand-green">{formatRupiah(r.pendapatan)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-300">{formatRupiah(r.hpp)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-brand-red">{formatRupiah(r.beban)}</td>
                <td className={`px-4 py-2 text-right tabular-nums font-semibold ${r.laba >= 0 ? "text-brand-green" : "text-brand-red"}`}>{formatRupiah(r.laba)}</td>
              </tr>
            ))}
            <tr className="border-t border-white/10 font-semibold bg-ink-800/40">
              <td className="px-4 py-2 text-slate-100" colSpan={2}>Konsolidasi</td>
              <td className="px-4 py-2 text-right tabular-nums text-brand-green">{formatRupiah(total.pendapatan)}</td>
              <td className="px-4 py-2 text-right tabular-nums text-slate-200">{formatRupiah(total.hpp)}</td>
              <td className="px-4 py-2 text-right tabular-nums text-brand-red">{formatRupiah(total.beban)}</td>
              <td className={`px-4 py-2 text-right tabular-nums ${total.laba >= 0 ? "text-brand-green" : "text-brand-red"}`}>{formatRupiah(total.laba)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-slate-600">
        Data historis sebelum Fase 7 di-backfill ke unit <span className="text-slate-400">V3BKS Mini Soccer</span>. Pilih unit saat input transaksi untuk memisahkan HSC.
      </p>
    </div>
  );
}
