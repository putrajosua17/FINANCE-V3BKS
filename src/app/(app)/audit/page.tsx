import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatTanggal } from "@/lib/format";

export const dynamic = "force-dynamic";

const AKSI_STYLE: Record<string, string> = {
  create: "bg-brand-green/15 text-brand-green",
  import: "bg-brand-blue/15 text-brand-blue",
  update: "bg-brand-amber/15 text-brand-amber",
  pay: "bg-brand-amber/15 text-brand-amber",
  settle: "bg-brand-green/15 text-brand-green",
  delete: "bg-brand-red/15 text-brand-red",
};

function waktu(d: Date) {
  return new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default async function AuditPage() {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "admin")) {
    return (
      <div className="card text-sm text-slate-400 max-w-md">
        Hanya Owner/Admin yang dapat melihat log aktivitas.
      </div>
    );
  }

  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-white">Log Aktivitas</h2>
        <p className="text-xs text-slate-500">200 aktivitas terakhir pengguna.</p>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-[11px] uppercase text-slate-500 border-b border-white/5">
              <th className="px-4 py-3 font-semibold">Waktu</th>
              <th className="px-4 py-3 font-semibold">Pengguna</th>
              <th className="px-4 py-3 font-semibold">Aksi</th>
              <th className="px-4 py-3 font-semibold">Entitas</th>
              <th className="px-4 py-3 font-semibold">Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Belum ada aktivitas tercatat.</td></tr>
            )}
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-white/5 hover:bg-ink-800/50">
                <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{formatTanggal(l.createdAt)} · {waktu(l.createdAt)}</td>
                <td className="px-4 py-2.5 text-slate-200">{l.userName}</td>
                <td className="px-4 py-2.5"><span className={`badge ${AKSI_STYLE[l.aksi] ?? "bg-ink-700 text-slate-300"}`}>{l.aksi}</span></td>
                <td className="px-4 py-2.5 text-slate-400">{l.entitas}</td>
                <td className="px-4 py-2.5 text-slate-500">{l.detail || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
