import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import { rangeBulan } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function RekeningPage() {
  const { start, end } = rangeBulan("ini");
  const [accounts, allTx, monthTx] = await Promise.all([
    prisma.account.findMany({ orderBy: { urutan: "asc" } }),
    prisma.transaction.findMany({ where: { deletedAt: null }, select: { accountId: true, tipe: true, jumlah: true } }),
    prisma.transaction.findMany({ where: { tanggal: { gte: start, lt: end }, deletedAt: null }, select: { accountId: true, tipe: true, jumlah: true } }),
  ]);

  const rows = accounts.map((a) => {
    const masuk = allTx.filter((t) => t.accountId === a.id && t.tipe === "income").reduce((s, t) => s + t.jumlah, 0);
    const keluar = allTx.filter((t) => t.accountId === a.id && t.tipe === "expense").reduce((s, t) => s + t.jumlah, 0);
    const mIn = monthTx.filter((t) => t.accountId === a.id && t.tipe === "income").reduce((s, t) => s + t.jumlah, 0);
    const mOut = monthTx.filter((t) => t.accountId === a.id && t.tipe === "expense").reduce((s, t) => s + t.jumlah, 0);
    return { ...a, saldo: a.saldoAwal + masuk - keluar, mIn, mOut };
  });
  const total = rows.reduce((s, a) => s + a.saldo, 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-white">Daftar Rekening</h2>
        <p className="text-xs text-slate-500">Saldo & mutasi bulan ini per rekening.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {rows.map((a) => (
          <div key={a.id} className="card">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300 text-sm">
                <span className="w-8 h-8 rounded-lg bg-ink-700 flex items-center justify-center">
                  {a.tipe === "cash" ? "💵" : "🏦"}
                </span>
                {a.nama}
              </span>
            </div>
            <p className="mt-3 text-lg font-bold text-white tabular-nums">{formatRupiah(a.saldo)}</p>
            <div className="mt-3 flex justify-between text-[11px]">
              <span className="text-brand-green">▲ {formatRupiah(a.mIn)}</span>
              <span className="text-brand-red">▼ {formatRupiah(a.mOut)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card flex items-center justify-between">
        <span className="text-sm text-slate-400">Total Saldo Seluruh Rekening</span>
        <span className="text-xl font-bold text-brand-green tabular-nums">{formatRupiah(total)}</span>
      </div>
    </div>
  );
}
