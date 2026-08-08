import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PengaturanPage() {
  const [rateCards, categories, accounts, settings, users] = await Promise.all([
    prisma.rateCard.findMany({ orderBy: { kode: "asc" } }),
    prisma.category.findMany({ orderBy: [{ tipe: "asc" }, { urutan: "asc" }] }),
    prisma.account.findMany({ orderBy: { urutan: "asc" } }),
    prisma.setting.findMany(),
    prisma.user.findMany({ select: { nama: true, email: true, role: true, isActive: true } }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-white">Pengaturan</h2>
        <p className="text-xs text-slate-500">Master data & parameter aplikasi.</p>
      </div>

      {/* Parameter */}
      <div className="card">
        <p className="card-title mb-3">Parameter</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {settings.map((s) => (
            <div key={s.key} className="rounded-lg bg-ink-800 p-3">
              <p className="text-[11px] text-slate-500">{s.key}</p>
              <p className="text-slate-200 font-medium">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RateCard */}
      <div className="card p-0 overflow-x-auto">
        <div className="px-4 py-3 border-b border-white/5"><p className="card-title">Master Tarif (RateCard)</p></div>
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="text-left text-[11px] uppercase text-slate-500">
              <th className="px-4 py-2 font-semibold">Kode</th>
              <th className="px-4 py-2 font-semibold">Nama</th>
              <th className="px-4 py-2 font-semibold">Kelompok</th>
              <th className="px-4 py-2 font-semibold text-right">Harga</th>
            </tr>
          </thead>
          <tbody>
            {rateCards.map((r) => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="px-4 py-2.5 text-slate-200 font-medium">{r.kode}</td>
                <td className="px-4 py-2.5 text-slate-400">{r.nama}</td>
                <td className="px-4 py-2.5"><span className="badge bg-ink-700 text-slate-300">{r.kelompok}</span></td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-200">{formatRupiah(r.harga)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Kategori */}
        <div className="card">
          <p className="card-title mb-3">Kategori</p>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <span key={c.id} className={`badge ${c.tipe === "income" ? "bg-brand-green/15 text-brand-green" : "bg-brand-red/15 text-brand-red"}`}>
                {c.nama}
              </span>
            ))}
          </div>
        </div>

        {/* Rekening */}
        <div className="card">
          <p className="card-title mb-3">Rekening</p>
          <ul className="space-y-1.5 text-sm">
            {accounts.map((a) => (
              <li key={a.id} className="flex justify-between">
                <span className="text-slate-300">{a.nama}</span>
                <span className="text-slate-500 text-xs">{a.tipe}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Users */}
      <div className="card p-0 overflow-x-auto">
        <div className="px-4 py-3 border-b border-white/5"><p className="card-title">Pengguna (Multi-user)</p></div>
        <table className="w-full text-sm min-w-[420px]">
          <thead>
            <tr className="text-left text-[11px] uppercase text-slate-500">
              <th className="px-4 py-2 font-semibold">Nama</th>
              <th className="px-4 py-2 font-semibold">Email</th>
              <th className="px-4 py-2 font-semibold">Role</th>
              <th className="px-4 py-2 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.email} className="border-t border-white/5">
                <td className="px-4 py-2.5 text-slate-200">{u.nama}</td>
                <td className="px-4 py-2.5 text-slate-400">{u.email}</td>
                <td className="px-4 py-2.5"><span className="badge bg-brand-blue/15 text-brand-blue">{u.role}</span></td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`badge ${u.isActive ? "bg-brand-green/15 text-brand-green" : "bg-slate-500/15 text-slate-400"}`}>
                    {u.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
