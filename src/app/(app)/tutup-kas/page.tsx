import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import TutupKasForm from "@/components/TutupKasForm";
import CashClosingApprove from "@/components/CashClosingApprove";
import { formatRupiah, formatTanggal } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TutupKasPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const canApprove = ["owner", "finance"].includes(session.role);

  const [accounts, businessUnits, closings, users] = await Promise.all([
    prisma.account.findMany({ where: { isActive: true }, orderBy: { urutan: "asc" }, select: { id: true, nama: true } }),
    prisma.businessUnit.findMany({ where: { isActive: true }, orderBy: { urutan: "asc" }, select: { id: true, nama: true, induk: true } }),
    prisma.cashClosing.findMany({ orderBy: { tanggal: "desc" }, take: 40, include: { account: true } }),
    prisma.user.findMany({ select: { id: true, nama: true } }),
  ]);
  const userName = new Map(users.map((u) => [u.id, u.nama]));

  // Rekap selisih per admin (akuntabilitas)
  const perAdmin = new Map<string, { count: number; totalSelisih: number }>();
  for (const c of closings) {
    const key = c.dibuatOlehId ?? "-";
    const cur = perAdmin.get(key) ?? { count: 0, totalSelisih: 0 };
    cur.count++;
    cur.totalSelisih += c.selisih;
    perAdmin.set(key, cur);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-white">Tutup Kas Harian</h2>
        <p className="text-xs text-slate-500">Serah-terima kas per shift · selisih otomatis dijurnal ke akun Selisih Kas saat disetujui.</p>
      </div>

      <TutupKasForm accounts={accounts} businessUnits={businessUnits} />

      {/* Riwayat selisih per admin */}
      <div className="card p-0 overflow-x-auto">
        <div className="px-4 py-3 border-b border-white/5"><p className="card-title">Riwayat Selisih Kas per Admin</p></div>
        <table className="w-full text-sm min-w-[420px]">
          <thead>
            <tr className="text-left text-[11px] uppercase text-slate-500">
              <th className="px-4 py-2 font-semibold">Admin</th>
              <th className="px-4 py-2 font-semibold text-right">Jumlah Tutup Kas</th>
              <th className="px-4 py-2 font-semibold text-right">Total Selisih</th>
            </tr>
          </thead>
          <tbody>
            {[...perAdmin.entries()].map(([uid, v]) => (
              <tr key={uid} className="border-t border-white/5">
                <td className="px-4 py-2 text-slate-200">{userName.get(uid) ?? "—"}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-300">{v.count}</td>
                <td className={`px-4 py-2 text-right tabular-nums ${v.totalSelisih === 0 ? "text-slate-300" : "text-brand-red"}`}>{formatRupiah(v.totalSelisih)}</td>
              </tr>
            ))}
            {perAdmin.size === 0 && <tr><td className="px-4 py-3 text-slate-500" colSpan={3}>Belum ada data.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Riwayat tutup kas */}
      <div className="card p-0 overflow-x-auto">
        <div className="px-4 py-3 border-b border-white/5"><p className="card-title">Riwayat Tutup Kas</p></div>
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-[11px] uppercase text-slate-500">
              <th className="px-4 py-2 font-semibold">Tanggal</th>
              <th className="px-4 py-2 font-semibold">Shift</th>
              <th className="px-4 py-2 font-semibold">Rekening</th>
              <th className="px-4 py-2 font-semibold text-right">Sistem</th>
              <th className="px-4 py-2 font-semibold text-right">Fisik</th>
              <th className="px-4 py-2 font-semibold text-right">Selisih</th>
              <th className="px-4 py-2 font-semibold">Status</th>
              <th className="px-4 py-2 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {closings.map((c) => (
              <tr key={c.id} className="border-t border-white/5">
                <td className="px-4 py-2 text-slate-300 whitespace-nowrap">{formatTanggal(c.tanggal)}</td>
                <td className="px-4 py-2 text-slate-400">{c.shift}</td>
                <td className="px-4 py-2 text-slate-300">{c.account.nama}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-300">{formatRupiah(c.saldoSistem)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-300">{formatRupiah(c.saldoFisik)}</td>
                <td className={`px-4 py-2 text-right tabular-nums ${c.selisih === 0 ? "text-brand-green" : "text-brand-red"}`}>{formatRupiah(c.selisih)}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] ${c.status === "disetujui" ? "bg-brand-green/10 text-brand-green" : "bg-brand-amber/10 text-brand-amber"}`}>{c.status}</span>
                </td>
                <td className="px-4 py-2 text-right">
                  {c.status === "disetujui" ? <span className="text-[11px] text-slate-500">terkunci</span> : <CashClosingApprove id={c.id} canApprove={canApprove} />}
                </td>
              </tr>
            ))}
            {closings.length === 0 && <tr><td className="px-4 py-4 text-slate-500" colSpan={8}>Belum ada tutup kas.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
