import { prisma } from "@/lib/prisma";
import { formatRupiah, formatPercent, formatTanggal } from "@/lib/format";
import { getDashboardData } from "@/lib/dashboard";
import ActionButton from "@/components/ActionButton";

export const dynamic = "force-dynamic";

export default async function TargetTagihanPage() {
  const [d, bills, piutang] = await Promise.all([
    getDashboardData("ini"),
    prisma.bill.findMany({ include: { category: true }, orderBy: { jatuhTempo: "asc" } }),
    prisma.booking.findMany({ where: { sisaPelunasan: { gt: 0 }, status: { not: "batal" } }, orderBy: { tanggalMain: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      {/* Target */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="card">
          <p className="card-title">Target Harian (tgl {d.progresTarget.harian.hari})</p>
          <p className="mt-2 text-lg font-bold text-white">{formatRupiah(d.progresTarget.harian.realisasi)}</p>
          <p className="text-[11px] text-slate-500 mb-2">dari {formatRupiah(d.progresTarget.harian.target)}</p>
          <div className="w-full h-2 rounded-full bg-ink-700 overflow-hidden">
            <div className="h-full bg-brand-green" style={{ width: `${Math.min(100, d.progresTarget.harian.persen)}%` }} />
          </div>
          <p className="text-right text-[11px] text-slate-400 mt-1">{formatPercent(d.progresTarget.harian.persen)}</p>
        </div>
        <div className="card">
          <p className="card-title">Target Bulanan</p>
          <p className="mt-2 text-lg font-bold text-white">{formatRupiah(d.progresTarget.bulanan.realisasi)}</p>
          <p className="text-[11px] text-slate-500 mb-2">dari {formatRupiah(d.progresTarget.bulanan.target)}</p>
          <div className="w-full h-2 rounded-full bg-ink-700 overflow-hidden">
            <div className="h-full bg-brand-blue" style={{ width: `${Math.min(100, d.progresTarget.bulanan.persen)}%` }} />
          </div>
          <p className="text-right text-[11px] text-slate-400 mt-1">{formatPercent(d.progresTarget.bulanan.persen)}</p>
        </div>
      </div>

      {/* Tagihan Rutin */}
      <div className="card p-0 overflow-x-auto">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <p className="card-title">Tagihan Rutin</p>
          <span className="text-xs text-brand-amber">Total pending: {formatRupiah(d.totalTagihan)}</span>
        </div>
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-left text-[11px] uppercase text-slate-500">
              <th className="px-4 py-2 font-semibold">Tagihan</th>
              <th className="px-4 py-2 font-semibold">Jatuh Tempo</th>
              <th className="px-4 py-2 font-semibold text-right">Nominal</th>
              <th className="px-4 py-2 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b.id} className="border-t border-white/5">
                <td className="px-4 py-3 text-slate-200">{b.nama}</td>
                <td className="px-4 py-3 text-slate-400">{formatTanggal(b.jatuhTempo)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-200">{formatRupiah(b.nominalEstimasi)}</td>
                <td className="px-4 py-3 text-right">
                  {b.status === "paid" ? (
                    <span className="badge bg-brand-green/15 text-brand-green">Lunas</span>
                  ) : (
                    <ActionButton url={`/api/bills/${b.id}/pay`} label="Tandai Lunas" confirmText={`Bayar ${b.nama}?`} className="btn-ghost text-xs" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Piutang Pelunasan */}
      <div className="card p-0 overflow-x-auto">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <p className="card-title">Piutang / Pelunasan Tertunda</p>
          <span className="text-xs text-brand-green">Total: {formatRupiah(d.totalPiutang)}</span>
        </div>
        <table className="w-full text-sm min-w-[620px]">
          <thead>
            <tr className="text-left text-[11px] uppercase text-slate-500">
              <th className="px-4 py-2 font-semibold">Penyewa</th>
              <th className="px-4 py-2 font-semibold">Main</th>
              <th className="px-4 py-2 font-semibold">Kontak</th>
              <th className="px-4 py-2 font-semibold text-right">Sisa</th>
              <th className="px-4 py-2 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {piutang.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Tidak ada piutang.</td></tr>
            )}
            {piutang.map((p) => (
              <tr key={p.id} className="border-t border-white/5">
                <td className="px-4 py-3 text-slate-200">{p.namaEntitas} <span className="text-slate-600">· {p.kode}</span></td>
                <td className="px-4 py-3 text-slate-400">{formatTanggal(p.tanggalMain)}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{p.noHp || "-"}</td>
                <td className="px-4 py-3 text-right tabular-nums text-brand-green">{formatRupiah(p.sisaPelunasan)}</td>
                <td className="px-4 py-3 text-right">
                  <ActionButton url={`/api/bookings/${p.id}/settle`} label="Tandai Lunas" confirmText={`Lunasi pelunasan ${p.namaEntitas}?`} className="btn-primary text-xs" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
