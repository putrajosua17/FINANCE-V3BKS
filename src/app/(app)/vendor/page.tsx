import { prisma } from "@/lib/prisma";
import VendorForm from "@/components/VendorForm";

export const dynamic = "force-dynamic";

const TIPE_BADGE: Record<string, string> = {
  vendor: "bg-brand-purple/15 text-brand-purple",
  pelanggan: "bg-brand-blue/15 text-brand-blue",
  keduanya: "bg-brand-amber/15 text-brand-amber",
};

export default async function VendorPage() {
  const contacts = await prisma.contact.findMany({
    where: { isActive: true },
    orderBy: { nama: "asc" },
    include: { _count: { select: { purchaseInvoices: true } } },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-white">Kontak · Vendor & Pelanggan</h2>
        <p className="text-xs text-slate-500">Master vendor/supplier & pelanggan untuk utang-piutang dan faktur.</p>
      </div>

      <VendorForm />

      <div className="card p-0 overflow-x-auto">
        <div className="px-4 py-3 border-b border-white/5"><p className="card-title">Daftar Kontak</p></div>
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-left text-[11px] uppercase text-slate-500">
              <th className="px-4 py-2 font-semibold">Nama</th>
              <th className="px-4 py-2 font-semibold">Tipe</th>
              <th className="px-4 py-2 font-semibold">No. HP</th>
              <th className="px-4 py-2 font-semibold">NPWP</th>
              <th className="px-4 py-2 font-semibold text-right">Termin</th>
              <th className="px-4 py-2 font-semibold text-right">Faktur</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className="border-t border-white/5">
                <td className="px-4 py-2 text-slate-200">{c.nama}</td>
                <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded text-[11px] ${TIPE_BADGE[c.tipe] ?? ""}`}>{c.tipe}</span></td>
                <td className="px-4 py-2 text-slate-400">{c.noHp ?? "-"}</td>
                <td className="px-4 py-2 text-slate-400">{c.npwp ? "✓" : "—"}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-400">{c.termin} hari</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-400">{c._count.purchaseInvoices}</td>
              </tr>
            ))}
            {contacts.length === 0 && <tr><td className="px-4 py-4 text-slate-500" colSpan={6}>Belum ada kontak.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
