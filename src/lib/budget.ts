import { prisma } from "@/lib/prisma";
import { rangeBulan, type Periode } from "@/lib/dashboard";

export function periodeKey(periode: Periode): string {
  const { tahun, bulan } = rangeBulan(periode);
  return `${tahun}-${String(bulan + 1).padStart(2, "0")}`;
}

export type BudgetRow = {
  categoryId: string;
  nama: string;
  budget: number;
  realisasi: number;
  sisa: number;
  persen: number;
  status: "aman" | "waspada" | "over";
};

export async function getBudgetComparison(periode: Periode = "ini") {
  const { start, end } = rangeBulan(periode);
  const key = periodeKey(periode);

  const [budgets, expenseCats, txMonth] = await Promise.all([
    prisma.budget.findMany({ where: { periode: key }, include: { category: true } }),
    prisma.category.findMany({ where: { tipe: "expense", isActive: true }, orderBy: { urutan: "asc" } }),
    prisma.transaction.findMany({
      where: { tipe: "expense", tanggal: { gte: start, lt: end }, deletedAt: null },
      select: { categoryId: true, jumlah: true },
    }),
  ]);

  const realisasiByCat = new Map<string, number>();
  for (const t of txMonth) {
    realisasiByCat.set(t.categoryId, (realisasiByCat.get(t.categoryId) ?? 0) + t.jumlah);
  }
  const budgetByCat = new Map(budgets.map((b) => [b.categoryId, b.nominal]));

  const rows: BudgetRow[] = expenseCats
    .map((c) => {
      const budget = budgetByCat.get(c.id) ?? 0;
      const realisasi = realisasiByCat.get(c.id) ?? 0;
      const persen = budget > 0 ? (realisasi / budget) * 100 : realisasi > 0 ? 100 : 0;
      const status: BudgetRow["status"] = persen > 100 ? "over" : persen >= 80 ? "waspada" : "aman";
      return { categoryId: c.id, nama: c.nama, budget, realisasi, sisa: budget - realisasi, persen, status };
    })
    .filter((r) => r.budget > 0 || r.realisasi > 0)
    .sort((a, b) => b.realisasi - a.realisasi);

  const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
  const totalRealisasi = rows.reduce((s, r) => s + r.realisasi, 0);
  const overCount = rows.filter((r) => r.status === "over").length;

  return { periode: key, rows, totalBudget, totalRealisasi, overCount };
}
