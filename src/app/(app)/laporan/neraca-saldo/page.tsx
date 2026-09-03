import Link from "next/link";
import { getTrialBalance } from "@/lib/reports";
import { listBusinessUnits } from "@/lib/business-unit";
import { formatRupiah, formatTanggal } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NeracaSaldoPage({ searchParams }: { searchParams: Promise<{ asOf?: string; bu?: string }> }) {
  const sp = await searchParams;
  const asOf = sp.asOf ? new Date(sp.asOf) : new Date();
  const buId = sp.bu || undefined;
  const [tb, units] = await Promise.all([getTrialBalance(asOf, buId), listBusinessUnits()]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold text-white">Neraca Saldo (Trial Balance)</h2>
          <p className="text-xs text-slate-500">Validasi keseimbangan jurnal per {formatTanggal(asOf, true)}.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <Link href="/laporan/neraca" className="btn-ghost">Neraca</Link>
          <Link href="/laporan/buku-besar" className="btn-ghost">Buku Besar</Link>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap text-xs">
        <Link href="/laporan/neraca-saldo" className={`px-3 py-1.5 rounded-lg border ${!buId ? "bg-ink-800 border-white/20 text-white" : "border-white/5 text-slate-400"}`}>Semua Unit</Link>
        {units.map((u) => (
          <Link key={u.id} href={`/laporan/neraca-saldo?bu=${u.id}`} className={`px-3 py-1.5 rounded-lg border ${buId === u.id ? "bg-ink-800 border-white/20 text-white" : "border-white/5 text-slate-400"}`}>{u.nama}</Link>
        ))}
      </div>

      <div className={`rounded-lg px-4 py-2 text-xs ${tb.seimbang ? "border border-brand-green/40 bg-brand-green/10 text-brand-green" : "border border-brand-red/40 bg-brand-red/10 text-brand-red"}`}>
        {tb.seimbang ? "✅ Seimbang — Σ debit = Σ kredit (selisih 0)." : `⚠️ Tidak seimbang — selisih ${formatRupiah(tb.selisih)}.`}
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-left text-[11px] uppercase text-slate-500">
              <th className="px-4 py-2 font-semibold">Kode</th>
              <th className="px-4 py-2 font-semibold">Nama Akun</th>
              <th className="px-4 py-2 font-semibold text-right">Debit</th>
              <th className="px-4 py-2 font-semibold text-right">Kredit</th>
            </tr>
          </thead>
          <tbody>
            {tb.rows.map((r) => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="px-4 py-2 text-slate-500 tabular-nums">{r.kode}</td>
                <td className="px-4 py-2 text-slate-200">{r.nama}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-200">{r.debit ? formatRupiah(r.debit) : "-"}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-200">{r.kredit ? formatRupiah(r.kredit) : "-"}</td>
              </tr>
            ))}
            {tb.rows.length === 0 && (
              <tr><td className="px-4 py-4 text-slate-500" colSpan={4}>Belum ada jurnal. Jalankan backfill / tambah transaksi.</td></tr>
            )}
            <tr className="border-t border-white/10 font-semibold bg-ink-800/40">
              <td className="px-4 py-2 text-slate-100" colSpan={2}>Total</td>
              <td className="px-4 py-2 text-right tabular-nums text-white">{formatRupiah(tb.totalDebit)}</td>
              <td className="px-4 py-2 text-right tabular-nums text-white">{formatRupiah(tb.totalKredit)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
