import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getTrialBalance } from "@/lib/reports";
import { periodeOf } from "@/lib/period-lock";
import { rangeBulan } from "@/lib/dashboard";
import { formatRupiah, namaBulan } from "@/lib/format";
import TutupBukuClient from "@/components/TutupBukuClient";

export const dynamic = "force-dynamic";

type Check = { label: string; ok: boolean; detail: string; tersedia: boolean };

export default async function TutupBukuPage({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const now = new Date();
  const periode = sp.periode && /^\d{4}-\d{2}$/.test(sp.periode) ? sp.periode : periodeOf(now);
  const [yy, mm] = periode.split("-").map(Number);
  const endOfPeriode = new Date(yy, mm, 0, 23, 59, 59); // hari terakhir bulan tsb

  const [tb, lock] = await Promise.all([
    getTrialBalance(endOfPeriode),
    prisma.periodLock.findFirst({ where: { periode, businessUnitId: null } }),
  ]);

  // Transaksi bulan berjalan tanpa jurnal (indikator integritas)
  const { start, end } = { start: new Date(yy, mm - 1, 1), end: new Date(yy, mm, 1) };
  const tanpaJurnal = await prisma.transaction.count({
    where: { tanggal: { gte: start, lt: end }, deletedAt: null, journalEntryId: null },
  });

  const checks: Check[] = [
    { label: "Neraca Saldo seimbang", ok: tb.seimbang, detail: tb.seimbang ? "Σ debit = Σ kredit" : `Selisih ${formatRupiah(tb.selisih)}`, tersedia: true },
    { label: "Semua transaksi berjurnal", ok: tanpaJurnal === 0, detail: tanpaJurnal === 0 ? "Semua transaksi punya jurnal" : `${tanpaJurnal} transaksi belum berjurnal`, tersedia: true },
    { label: "Rekonsiliasi bank selesai", ok: false, detail: "Tersedia pada Fase 8 (F-02)", tersedia: false },
    { label: "Tutup kas harian lengkap", ok: false, detail: "Tersedia pada Fase 8 (F-03)", tersedia: false },
    { label: "Tidak ada transaksi tanpa bukti", ok: false, detail: "Tersedia pada Fase 7+ (F-04)", tersedia: false },
  ];

  // Gate kunci: hanya checklist yang tersedia yang wajib lulus.
  const canLock = checks.filter((c) => c.tersedia).every((c) => c.ok);
  const status = lock?.status ?? "terbuka";

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold text-white">Tutup Buku</h2>
          <p className="text-xs text-slate-500">Kunci periode {namaBulan(mm - 1, true)} {yy} agar laporan final tidak berubah.</p>
        </div>
      </div>

      <div className="card space-y-3">
        <p className="card-title">Checklist Pra-Kunci</p>
        <ul className="space-y-2">
          {checks.map((c) => (
            <li key={c.label} className="flex items-start gap-3 text-sm">
              <span className={`mt-0.5 ${!c.tersedia ? "text-slate-600" : c.ok ? "text-brand-green" : "text-brand-red"}`}>
                {!c.tersedia ? "○" : c.ok ? "✓" : "✕"}
              </span>
              <div>
                <p className={`${!c.tersedia ? "text-slate-500" : "text-slate-200"}`}>{c.label}</p>
                <p className="text-[11px] text-slate-500">{c.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <TutupBukuClient periode={periode} status={status} role={session.role} canLock={canLock} />
        {status !== "terbuka" && lock?.catatan && (
          <p className="text-[11px] text-slate-500 mt-2">Catatan: {lock.catatan}</p>
        )}
      </div>

      <p className="text-[11px] text-slate-600">
        Setelah dikunci, transaksi pada periode ini tidak dapat dibuat, diubah, atau dihapus (HTTP 423). Hanya owner yang dapat membuka kembali dengan alasan tercatat di Log Aktivitas.
      </p>
    </div>
  );
}
