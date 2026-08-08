import RiwayatTable from "@/components/RiwayatTable";

export const dynamic = "force-dynamic";

export default function RiwayatPage() {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-white">Riwayat Transaksi</h2>
        <p className="text-xs text-slate-500">Semua pemasukan & pengeluaran.</p>
      </div>
      <RiwayatTable />
    </div>
  );
}
