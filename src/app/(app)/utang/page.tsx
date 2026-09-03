import { prisma } from "@/lib/prisma";
import PurchaseInvoiceForm from "@/components/PurchaseInvoiceForm";
import PayInvoiceButton from "@/components/PayInvoiceButton";
import { agingOf, emptyAging, AGING_LABELS, type AgingBucketKey } from "@/lib/aging";
import { formatRupiah, formatTanggal } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function UtangPage() {
  const [invoices, vendors, accounts, businessUnits, bebanAkun] = await Promise.all([
    prisma.purchaseInvoice.findMany({
      where: { status: { in: ["belum", "sebagian"] } },
      orderBy: { jatuhTempo: "asc" },
      include: { vendor: true },
    }),
    prisma.contact.findMany({ where: { isActive: true, tipe: { in: ["vendor", "keduanya"] } }, orderBy: { nama: "asc" }, select: { id: true, nama: true, termin: true, npwp: true } }),
    prisma.account.findMany({ where: { isActive: true }, orderBy: { urutan: "asc" }, select: { id: true, nama: true } }),
    prisma.businessUnit.findMany({ where: { isActive: true }, orderBy: { urutan: "asc" }, select: { id: true, nama: true, induk: true } }),
    prisma.chartOfAccount.findMany({ where: { tipe: { in: ["BEBAN", "HPP"] }, parentId: { not: null } }, orderBy: { kode: "asc" }, select: { kode: true, nama: true } }),
  ]);

  // Aging
  const aging = emptyAging();
  let totalUtang = 0;
  const rows = invoices.map((inv) => {
    const sisa = inv.total - inv.terbayar;
    const { hari, bucket } = agingOf(inv.jatuhTempo);
    aging[bucket] += sisa;
    totalUtang += sisa;
    return { inv, sisa, hari, bucket };
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-white">Utang Usaha (AP)</h2>
        <p className="text-xs text-slate-500">Faktur pembelian & jadwal pembayaran vendor · umur utang (aging).</p>
      </div>

      {/* Aging summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(Object.keys(AGING_LABELS) as AgingBucketKey[]).map((k) => (
          <div key={k} className="card">
            <p className="text-[11px] text-slate-400">{AGING_LABELS[k]}</p>
            <p className={`text-base font-bold tabular-nums ${k === "b90plus" && aging[k] > 0 ? "text-brand-red" : "text-slate-200"}`}>{formatRupiah(aging[k])}</p>
          </div>
        ))}
      </div>

      <PurchaseInvoiceForm vendors={vendors} bebanAkun={bebanAkun} businessUnits={businessUnits} />

      <div className="card p-0 overflow-x-auto">
        <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
          <p className="card-title">Faktur Belum Lunas</p>
          <p className="text-xs text-slate-400">Total utang: <span className="text-white tabular-nums">{formatRupiah(totalUtang)}</span></p>
        </div>
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="text-left text-[11px] uppercase text-slate-500">
              <th className="px-4 py-2 font-semibold">No.</th>
              <th className="px-4 py-2 font-semibold">Vendor</th>
              <th className="px-4 py-2 font-semibold">Jatuh Tempo</th>
              <th className="px-4 py-2 font-semibold text-right">Total</th>
              <th className="px-4 py-2 font-semibold text-right">Sisa</th>
              <th className="px-4 py-2 font-semibold">Umur</th>
              <th className="px-4 py-2 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ inv, sisa, hari, bucket }) => (
              <tr key={inv.id} className="border-t border-white/5">
                <td className="px-4 py-2 text-slate-500 tabular-nums text-xs">{inv.nomor}</td>
                <td className="px-4 py-2 text-slate-200">{inv.vendor.nama}</td>
                <td className="px-4 py-2 text-slate-400 whitespace-nowrap">{formatTanggal(inv.jatuhTempo)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-300">{formatRupiah(inv.total)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-100">{formatRupiah(sisa)}</td>
                <td className="px-4 py-2 text-xs"><span className={bucket === "belum" ? "text-slate-400" : hari > 90 ? "text-brand-red" : "text-brand-amber"}>{hari <= 0 ? `${-hari} hari lagi` : `telat ${hari} hari`}</span></td>
                <td className="px-4 py-2 text-right"><PayInvoiceButton id={inv.id} sisa={sisa} accounts={accounts} /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="px-4 py-4 text-slate-500" colSpan={7}>Tidak ada utang belum lunas.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
