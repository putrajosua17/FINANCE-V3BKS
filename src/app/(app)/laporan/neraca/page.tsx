import Link from "next/link";
import { getBalanceSheet, type NeracaSection } from "@/lib/reports";
import { listBusinessUnits } from "@/lib/business-unit";
import { formatRupiah, formatTanggal } from "@/lib/format";

export const dynamic = "force-dynamic";

function SectionTable({ section }: { section: NeracaSection }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5"><p className="card-title">{section.judul}</p></div>
      <table className="w-full text-sm">
        <tbody>
          {section.akun.map((a) => (
            <tr key={a.kode + a.nama} className="border-t border-white/5">
              <td className="px-4 py-2 text-slate-300"><span className="text-slate-600 text-xs mr-2">{a.kode}</span>{a.nama}</td>
              <td className="px-4 py-2 text-right tabular-nums text-slate-200">{formatRupiah(a.saldo)}</td>
            </tr>
          ))}
          {section.akun.length === 0 && (
            <tr><td className="px-4 py-3 text-slate-500 text-sm" colSpan={2}>Belum ada saldo.</td></tr>
          )}
          <tr className="border-t border-white/10 font-semibold bg-ink-800/40">
            <td className="px-4 py-2 text-slate-100">Total {section.judul}</td>
            <td className="px-4 py-2 text-right tabular-nums text-white">{formatRupiah(section.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default async function NeracaPage({ searchParams }: { searchParams: Promise<{ asOf?: string; bu?: string }> }) {
  const sp = await searchParams;
  const asOf = sp.asOf ? new Date(sp.asOf) : new Date();
  const buId = sp.bu || undefined;
  const [neraca, units] = await Promise.all([getBalanceSheet(asOf, buId), listBusinessUnits()]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold text-white">Neraca (Balance Sheet)</h2>
          <p className="text-xs text-slate-500">Posisi keuangan per {formatTanggal(asOf, true)} · Aset = Kewajiban + Ekuitas.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <Link href="/laporan/neraca-saldo" className="btn-ghost">Neraca Saldo</Link>
          <Link href="/laporan/buku-besar" className="btn-ghost">Buku Besar</Link>
        </div>
      </div>

      {/* Filter unit */}
      <div className="flex gap-1 flex-wrap text-xs">
        <Link href="/laporan/neraca" className={`px-3 py-1.5 rounded-lg border ${!buId ? "bg-ink-800 border-white/20 text-white" : "border-white/5 text-slate-400"}`}>Semua Unit</Link>
        {units.map((u) => (
          <Link key={u.id} href={`/laporan/neraca?bu=${u.id}`} className={`px-3 py-1.5 rounded-lg border ${buId === u.id ? "bg-ink-800 border-white/20 text-white" : "border-white/5 text-slate-400"}`}>{u.nama}</Link>
        ))}
      </div>

      {!neraca.seimbang && (
        <div className="rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-2 text-xs text-brand-red">
          ⚠️ Neraca tidak seimbang (selisih {formatRupiah(neraca.totalAset - neraca.totalPasiva)}). Periksa pemetaan COA / jalankan backfill.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionTable section={neraca.aset} />
        <div className="space-y-4">
          <SectionTable section={neraca.kewajiban} />
          <SectionTable section={neraca.ekuitas} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="card flex items-center justify-between">
          <span className="text-slate-400 text-sm">Total Aset</span>
          <span className="text-lg font-bold text-white tabular-nums">{formatRupiah(neraca.totalAset)}</span>
        </div>
        <div className="card flex items-center justify-between">
          <span className="text-slate-400 text-sm">Total Kewajiban + Ekuitas</span>
          <span className="text-lg font-bold text-white tabular-nums">{formatRupiah(neraca.totalPasiva)}</span>
        </div>
      </div>
    </div>
  );
}
