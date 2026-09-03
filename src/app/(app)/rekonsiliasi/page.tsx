import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RekonsiliasiUpload from "@/components/RekonsiliasiUpload";
import { formatRupiah, formatTanggal } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  draft: "text-slate-400 bg-slate-500/10",
  rekonsiliasi: "text-brand-amber bg-brand-amber/10",
  selesai: "text-brand-green bg-brand-green/10",
};

export default async function RekonsiliasiPage() {
  const [accounts, statements] = await Promise.all([
    prisma.account.findMany({ where: { isActive: true, tipe: "bank" }, orderBy: { urutan: "asc" } }),
    prisma.bankStatement.findMany({
      orderBy: { createdAt: "desc" },
      include: { account: true, _count: { select: { lines: true } } },
      take: 30,
    }),
  ]);

  // Hitung baris cocok per statement (untuk ringkasan)
  const cocokCounts = await prisma.bankStatementLine.groupBy({
    by: ["statementId"],
    where: { status: { in: ["cocok", "manual", "diabaikan"] } },
    _count: { _all: true },
  });
  const cocokMap = new Map(cocokCounts.map((c) => [c.statementId, c._count._all]));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-white">Rekonsiliasi Bank</h2>
        <p className="text-xs text-slate-500">Impor mutasi bank → sistem mengusulkan pasangan → konfirmasi 1 klik.</p>
      </div>

      <RekonsiliasiUpload accounts={accounts.length ? accounts : []} />

      <div className="card p-0 overflow-x-auto">
        <div className="px-4 py-3 border-b border-white/5"><p className="card-title">Riwayat Rekonsiliasi</p></div>
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-[11px] uppercase text-slate-500">
              <th className="px-4 py-2 font-semibold">File</th>
              <th className="px-4 py-2 font-semibold">Rekening</th>
              <th className="px-4 py-2 font-semibold">Periode</th>
              <th className="px-4 py-2 font-semibold text-right">Baris</th>
              <th className="px-4 py-2 font-semibold text-right">Saldo Akhir</th>
              <th className="px-4 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {statements.map((s) => (
              <tr key={s.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="px-4 py-2">
                  <Link href={`/rekonsiliasi/${s.id}`} className="text-brand-blue hover:underline">{s.namaFile ?? "(tanpa nama)"}</Link>
                </td>
                <td className="px-4 py-2 text-slate-300">{s.account.nama}</td>
                <td className="px-4 py-2 text-slate-400 text-xs">{formatTanggal(s.periodeAwal)} – {formatTanggal(s.periodeAkhir)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-300">{cocokMap.get(s.id) ?? 0}/{s._count.lines}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-200">{formatRupiah(s.saldoAkhir)}</td>
                <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded text-[11px] ${STATUS_BADGE[s.status] ?? ""}`}>{s.status}</span></td>
              </tr>
            ))}
            {statements.length === 0 && (
              <tr><td className="px-4 py-4 text-slate-500" colSpan={6}>Belum ada rekonsiliasi. Impor e-statement di atas untuk memulai.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
