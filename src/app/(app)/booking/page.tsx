import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { rangeBulan } from "@/lib/dashboard";
import BookingForm from "@/components/BookingForm";
import BookingRowActions from "@/components/BookingRowActions";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  booked: "bg-slate-500/15 text-slate-300",
  dp: "bg-brand-amber/15 text-brand-amber",
  lunas: "bg-brand-green/15 text-brand-green",
  selesai: "bg-brand-blue/15 text-brand-blue",
  batal: "bg-brand-red/15 text-brand-red",
};

export default async function BookingPage() {
  const { start, end } = rangeBulan("ini");
  const [bookings, incomeTx, rateCards, accounts] = await Promise.all([
    prisma.booking.findMany({ orderBy: { tanggalMain: "asc" }, include: { account: true } }),
    prisma.transaction.findMany({
      where: { tipe: "income", tanggal: { gte: start, lt: end }, category: { nama: "Rental" }, deletedAt: null },
      select: { durasi: true },
    }),
    prisma.rateCard.findMany({ where: { isActive: true, kelompok: "RENTAL" }, orderBy: { kode: "asc" } }),
    prisma.account.findMany({ where: { isActive: true }, orderBy: { urutan: "asc" } }),
  ]);

  // Analisa jam main (bucket durasi)
  const buckets = [1, 2, 3, 4];
  const jamMain = buckets.map((b) => ({
    jam: b,
    count: incomeTx.filter((t) => (t.durasi ?? 1) === b).length,
  }));
  const lebih = incomeTx.filter((t) => (t.durasi ?? 1) > 4).length;
  const totalJam = incomeTx.reduce((s, t) => s + (t.durasi ?? 1), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-white">Booking & Jadwal</h2>
          <p className="text-xs text-slate-500">Daftar booking, status pembayaran, & analisa jam main.</p>
        </div>
        <BookingForm rateCards={rateCards} accounts={accounts} />
      </div>

      {/* Analisa jam main */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {jamMain.map((j) => (
          <div key={j.jam} className="card text-center">
            <p className="card-title">{j.jam} Jam</p>
            <p className="mt-2 text-xl font-bold text-white">{j.count}</p>
          </div>
        ))}
        <div className="card text-center">
          <p className="card-title">&gt;4 Jam</p>
          <p className="mt-2 text-xl font-bold text-white">{lebih}</p>
        </div>
        <div className="card text-center">
          <p className="card-title">Total Jam</p>
          <p className="mt-2 text-xl font-bold text-brand-green">{totalJam}</p>
        </div>
      </div>

      {/* Daftar booking */}
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-[11px] uppercase text-slate-500 border-b border-white/5">
              <th className="px-4 py-3 font-semibold">Tanggal Main</th>
              <th className="px-4 py-3 font-semibold">Kode</th>
              <th className="px-4 py-3 font-semibold">Penyewa</th>
              <th className="px-4 py-3 font-semibold">Kontak</th>
              <th className="px-4 py-3 font-semibold text-right">Harga</th>
              <th className="px-4 py-3 font-semibold text-right">Sisa</th>
              <th className="px-4 py-3 font-semibold text-center">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Belum ada booking.</td></tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id} className="border-b border-white/5 hover:bg-ink-800/50">
                <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{formatTanggal(b.tanggalMain)}</td>
                <td className="px-4 py-3 text-slate-400">{b.kode}</td>
                <td className="px-4 py-3 text-slate-200">{b.namaEntitas}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{b.noHp || "-"}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-300">{formatRupiah(b.harga)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-brand-amber">{b.sisaPelunasan > 0 ? formatRupiah(b.sisaPelunasan) : "-"}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`badge ${STATUS_STYLE[b.status] ?? "bg-slate-500/15 text-slate-300"}`}>{b.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <BookingRowActions id={b.id} status={b.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
