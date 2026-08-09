import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { bestMatch, type CandidateTx, type LineForMatch } from "@/lib/reconcile";
import RekonsiliasiDetail, { type ReconLine } from "@/components/RekonsiliasiDetail";
import { formatRupiah, formatTanggal } from "@/lib/format";

export const dynamic = "force-dynamic";

function txLabel(t: { namaEntitas: string | null; catatan: string | null; tempatBeli: string | null; jumlah: number }) {
  return t.namaEntitas || t.tempatBeli || t.catatan || formatRupiah(t.jumlah);
}

export default async function RekonsiliasiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const statement = await prisma.bankStatement.findUnique({
    where: { id },
    include: {
      account: true,
      lines: { orderBy: { tanggal: "asc" }, include: { transaction: true } },
    },
  });
  if (!statement) notFound();

  const [categories, businessUnits, candidatesRaw] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { urutan: "asc" }, select: { id: true, nama: true, tipe: true } }),
    prisma.businessUnit.findMany({ where: { isActive: true }, orderBy: { urutan: "asc" }, select: { id: true, nama: true, induk: true } }),
    prisma.transaction.findMany({
      where: { accountId: statement.accountId, deletedAt: null, bankStatementLine: null },
      select: { id: true, tanggal: true, tipe: true, jumlah: true, namaEntitas: true, catatan: true, tempatBeli: true },
    }),
  ]);
  const candidates: CandidateTx[] = candidatesRaw;
  const candById = new Map(candidatesRaw.map((c) => [c.id, c]));

  const lines: ReconLine[] = statement.lines.map((l) => {
    let suggestion: ReconLine["suggestion"] = null;
    if (l.status === "belum") {
      const lm: LineForMatch = { tanggal: l.tanggal, keterangan: l.keterangan, debit: l.debit, kredit: l.kredit };
      const best = bestMatch(lm, candidates);
      if (best) {
        const tx = candById.get(best.transactionId)!;
        suggestion = { txId: best.transactionId, skor: best.skor, label: txLabel(tx), jumlah: tx.jumlah };
      }
    }
    return {
      id: l.id,
      tanggal: l.tanggal.toISOString(),
      keterangan: l.keterangan,
      debit: l.debit,
      kredit: l.kredit,
      status: l.status,
      skorCocok: l.skorCocok,
      matched: l.transaction ? { label: txLabel(l.transaction), jumlah: l.transaction.jumlah } : null,
      suggestion,
    };
  });

  const belum = lines.filter((l) => l.status === "belum").length;
  const movement = statement.lines.reduce((s, l) => s + l.kredit - l.debit, 0);
  const selisihSaldo = Math.round((statement.saldoAkhir - (statement.saldoAwal + movement)) * 100) / 100;
  const canFinalize = statement.status !== "selesai" && belum === 0 && Math.abs(selisihSaldo) <= 1;

  const cocok = lines.filter((l) => l.status === "cocok" || l.status === "manual").length;
  const diabaikan = lines.filter((l) => l.status === "diabaikan").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold text-white">Rekonsiliasi · {statement.account.nama}</h2>
          <p className="text-xs text-slate-500">{statement.namaFile} · {formatTanggal(statement.periodeAwal)} – {formatTanggal(statement.periodeAkhir)}</p>
        </div>
        <Link href="/rekonsiliasi" className="text-sm text-slate-500 hover:text-slate-200">← Kembali</Link>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card"><p className="text-xs text-slate-400">Cocok / Dibuat</p><p className="text-lg font-bold text-brand-green tabular-nums">{cocok}</p></div>
        <div className="card"><p className="text-xs text-slate-400">Belum</p><p className={`text-lg font-bold tabular-nums ${belum ? "text-brand-amber" : "text-slate-300"}`}>{belum}</p></div>
        <div className="card"><p className="text-xs text-slate-400">Diabaikan</p><p className="text-lg font-bold text-slate-300 tabular-nums">{diabaikan}</p></div>
        <div className="card"><p className="text-xs text-slate-400">Selisih Saldo</p><p className={`text-lg font-bold tabular-nums ${Math.abs(selisihSaldo) <= 1 ? "text-brand-green" : "text-brand-red"}`}>{formatRupiah(selisihSaldo)}</p></div>
      </div>

      <RekonsiliasiDetail
        statementId={statement.id}
        status={statement.status}
        canFinalize={canFinalize}
        lines={lines}
        categories={categories}
        businessUnits={businessUnits}
      />
    </div>
  );
}
