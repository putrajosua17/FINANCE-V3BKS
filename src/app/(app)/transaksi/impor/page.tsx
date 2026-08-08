import ImportClient from "@/components/ImportClient";

export const dynamic = "force-dynamic";

export default function ImporPage() {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-white">Impor Data</h2>
        <p className="text-xs text-slate-500">Impor transaksi massal dari CSV/Excel (ekspor sebagai CSV terlebih dahulu).</p>
      </div>
      <ImportClient />
    </div>
  );
}
