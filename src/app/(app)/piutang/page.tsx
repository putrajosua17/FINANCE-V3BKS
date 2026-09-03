import { prisma } from "@/lib/prisma";
import { agingOf, emptyAging, AGING_LABELS, type AgingBucketKey } from "@/lib/aging";
import { waLink, DEFAULT_TEMPLATE_AR } from "@/lib/reminder";
import { formatRupiah, formatTanggal } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PiutangPage() {
  const [bookings, tmplSetting] = await Promise.all([
    prisma.booking.findMany({
      where: { sisaPelunasan: { gt: 0 }, status: { not: "batal" } },
      orderBy: { tanggalMain: "asc" },
    }),
    prisma.setting.findUnique({ where: { key: "template_reminder_ar" } }),
  ]);
  const template = tmplSetting?.value || DEFAULT_TEMPLATE_AR;

  // Aging + skor keandalan per pelanggan (telat = jatuh tempo terlewati)
  const aging = emptyAging();
  let totalPiutang = 0;
  const perPelanggan = new Map<string, { total: number; telat: number }>();
  const rows = bookings.map((b) => {
    const { hari, bucket } = agingOf(b.tanggalMain);
    aging[bucket] += b.sisaPelunasan;
    totalPiutang += b.sisaPelunasan;
    const p = perPelanggan.get(b.namaEntitas) ?? { total: 0, telat: 0 };
    p.total += b.sisaPelunasan;
    if (hari > 0) p.telat += 1;
    perPelanggan.set(b.namaEntitas, p);
    return {
      b,
      hari,
      bucket,
      link: waLink(b.noHp, template, { nama: b.namaEntitas, jumlah: b.harga, tanggalMain: b.tanggalMain, sisa: b.sisaPelunasan }),
    };
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-white">Piutang (AR) & Reminder</h2>
        <p className="text-xs text-slate-500">Sisa pelunasan booking · umur piutang & pengingat WhatsApp siap kirim (1 klik).</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(Object.keys(AGING_LABELS) as AgingBucketKey[]).map((k) => (
          <div key={k} className="card">
            <p className="text-[11px] text-slate-400">{AGING_LABELS[k]}</p>
            <p className={`text-base font-bold tabular-nums ${k === "b90plus" && aging[k] > 0 ? "text-brand-red" : "text-slate-200"}`}>{formatRupiah(aging[k])}</p>
          </div>
        ))}
      </div>

      <div className="card p-0 overflow-x-auto">
        <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
          <p className="card-title">Daftar Piutang</p>
          <p className="text-xs text-slate-400">Total: <span className="text-white tabular-nums">{formatRupiah(totalPiutang)}</span></p>
        </div>
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="text-left text-[11px] uppercase text-slate-500">
              <th className="px-4 py-2 font-semibold">Pelanggan</th>
              <th className="px-4 py-2 font-semibold">Tgl Main</th>
              <th className="px-4 py-2 font-semibold text-right">Total</th>
              <th className="px-4 py-2 font-semibold text-right">Sisa</th>
              <th className="px-4 py-2 font-semibold">Umur</th>
              <th className="px-4 py-2 font-semibold text-right">Reminder</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ b, hari, link }) => {
              const rel = perPelanggan.get(b.namaEntitas)!;
              return (
                <tr key={b.id} className="border-t border-white/5">
                  <td className="px-4 py-2 text-slate-200">
                    {b.namaEntitas}
                    {rel.telat >= 2 && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-brand-red/15 text-brand-red">sering telat</span>}
                  </td>
                  <td className="px-4 py-2 text-slate-400 whitespace-nowrap">{formatTanggal(b.tanggalMain)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-300">{formatRupiah(b.harga)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-100">{formatRupiah(b.sisaPelunasan)}</td>
                  <td className="px-4 py-2 text-xs"><span className={hari <= 0 ? "text-slate-400" : hari > 60 ? "text-brand-red" : "text-brand-amber"}>{hari <= 0 ? `${-hari} hari lagi` : `telat ${hari} hari`}</span></td>
                  <td className="px-4 py-2 text-right">
                    {link ? (
                      <a href={link} target="_blank" rel="noopener noreferrer" className="btn-primary text-[11px] inline-block">💬 Kirim WA</a>
                    ) : (
                      <span className="text-[11px] text-slate-500">no HP kosong</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td className="px-4 py-4 text-slate-500" colSpan={6}>Tidak ada piutang berjalan.</td></tr>}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-slate-600">
        Template pesan dapat diatur di Pengaturan (kunci <code className="text-slate-400">template_reminder_ar</code>) dengan variabel {"{nama}"}, {"{jumlah}"}, {"{tanggal_main}"}, {"{sisa}"}. Mode semi-otomatis (1 klik/pelanggan) dipilih agar aman dari pemblokiran broadcast.
      </p>
    </div>
  );
}
