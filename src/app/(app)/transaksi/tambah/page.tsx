import { prisma } from "@/lib/prisma";
import TransactionForm from "@/components/TransactionForm";

export const dynamic = "force-dynamic";

export default async function TambahPage({
  searchParams,
}: {
  searchParams: Promise<{ quick?: string; tipe?: string }>;
}) {
  const sp = await searchParams;
  const [categories, accounts, rateCards] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { urutan: "asc" } }),
    prisma.account.findMany({ where: { isActive: true }, orderBy: { urutan: "asc" } }),
    prisma.rateCard.findMany({ where: { isActive: true }, orderBy: { kode: "asc" } }),
  ]);

  const quick = sp.quick === "1";

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-white">
          {quick ? "Quick Spend" : "Tambah Transaksi"}
        </h2>
        <p className="text-xs text-slate-500">
          {quick ? "Catat pengeluaran cepat." : "Catat pemasukan (booking/jasa) atau pengeluaran."}
        </p>
      </div>
      <TransactionForm
        categories={categories}
        accounts={accounts}
        rateCards={rateCards}
        defaultTipe={sp.tipe === "expense" ? "expense" : "income"}
        quick={quick}
      />
    </div>
  );
}
