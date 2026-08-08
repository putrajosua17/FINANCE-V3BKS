import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import PengaturanClient from "@/components/PengaturanClient";

export const dynamic = "force-dynamic";

export default async function PengaturanPage() {
  const [session, rateCards, categories, accounts, settings, users] = await Promise.all([
    getSession(),
    prisma.rateCard.findMany({ orderBy: { kode: "asc" } }),
    prisma.category.findMany({ orderBy: [{ tipe: "asc" }, { urutan: "asc" }] }),
    prisma.account.findMany({ orderBy: { urutan: "asc" } }),
    prisma.setting.findMany(),
    prisma.user.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, nama: true, email: true, role: true, isActive: true } }),
  ]);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-white">Pengaturan</h2>
        <p className="text-xs text-slate-500">Kelola master data & parameter aplikasi.</p>
      </div>
      <PengaturanClient
        rateCards={rateCards}
        categories={categories}
        accounts={accounts}
        users={users}
        settings={settings}
        role={session?.role ?? "admin"}
      />
    </div>
  );
}
