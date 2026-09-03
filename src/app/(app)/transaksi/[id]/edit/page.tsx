import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TransactionForm from "@/components/TransactionForm";

export const dynamic = "force-dynamic";

export default async function EditTransaksiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tx, categories, accounts, rateCards, businessUnits] = await Promise.all([
    prisma.transaction.findFirst({ where: { id, deletedAt: null } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { urutan: "asc" } }),
    prisma.account.findMany({ where: { isActive: true }, orderBy: { urutan: "asc" } }),
    prisma.rateCard.findMany({ where: { isActive: true }, orderBy: { kode: "asc" } }),
    prisma.businessUnit.findMany({ where: { isActive: true }, orderBy: { urutan: "asc" } }),
  ]);
  if (!tx) notFound();

  const initial = {
    id: tx.id,
    tipe: tx.tipe as "income" | "expense",
    tanggal: new Date(tx.tanggal).toISOString().slice(0, 10),
    categoryId: tx.categoryId,
    accountId: tx.accountId,
    jumlah: String(tx.jumlah),
    catatan: tx.catatan ?? "",
    rateCode: tx.rateCode ?? "",
    jam: tx.jam ?? "",
    durasi: tx.durasi ? String(tx.durasi) : "1",
    namaEntitas: tx.namaEntitas ?? "",
    noHp: tx.noHp ?? "",
    statusBayar: tx.statusBayar ?? "lunas",
    tempatBeli: tx.tempatBeli ?? "",
    businessUnitId: tx.businessUnitId ?? "",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Edit Transaksi</h2>
          <p className="text-xs text-slate-500">Ubah detail transaksi lalu simpan.</p>
        </div>
        <Link href="/transaksi/riwayat" className="text-sm text-slate-500 hover:text-slate-200">← Kembali</Link>
      </div>
      <TransactionForm categories={categories} accounts={accounts} rateCards={rateCards} businessUnits={businessUnits} initial={initial} />
    </div>
  );
}
