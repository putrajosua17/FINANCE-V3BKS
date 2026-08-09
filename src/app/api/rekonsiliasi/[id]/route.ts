import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { postJournalForTransaction } from "@/lib/journal";
import { lineDirection } from "@/lib/reconcile";
import { defaultBusinessUnitId } from "@/lib/business-unit";

// Aksi rekonsiliasi pada sebuah statement.
// body.action: match | unmatch | ignore | create-tx | finalize
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: statementId } = await params;

  try {
    const b = await req.json();
    const action = String(b.action || "");

    if (action === "match") {
      await prisma.bankStatementLine.update({
        where: { id: b.lineId },
        data: { transactionId: b.transactionId, status: "cocok", skorCocok: b.skor ?? null },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "unmatch") {
      await prisma.bankStatementLine.update({
        where: { id: b.lineId },
        data: { transactionId: null, status: "belum" },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "ignore") {
      await prisma.bankStatementLine.update({
        where: { id: b.lineId },
        data: { status: "diabaikan" },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "create-tx") {
      const line = await prisma.bankStatementLine.findUnique({
        where: { id: b.lineId },
        include: { statement: true },
      });
      if (!line) return NextResponse.json({ error: "Baris tidak ditemukan" }, { status: 404 });
      if (!b.categoryId) return NextResponse.json({ error: "Kategori wajib dipilih" }, { status: 400 });

      const dir = lineDirection(line);
      const buId = b.businessUnitId || (await defaultBusinessUnitId());

      await prisma.$transaction(async (db) => {
        const tx = await db.transaction.create({
          data: {
            tanggal: line.tanggal,
            tipe: dir.tipe,
            jumlah: dir.nominal,
            catatan: line.keterangan,
            categoryId: b.categoryId,
            accountId: line.statement.accountId,
            businessUnitId: buId,
            createdById: session.id,
            ...(dir.tipe === "income" ? { statusBayar: "lunas" } : { tempatBeli: "Bank" }),
          },
        });
        await postJournalForTransaction(db, tx.id);
        await db.bankStatementLine.update({
          where: { id: line.id },
          data: { transactionId: tx.id, status: "manual", skorCocok: 1 },
        });
      });
      await logAudit(session, "create", "rekonsiliasi", `Transaksi dari mutasi bank · ${line.keterangan.slice(0, 40)}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "finalize") {
      const st = await prisma.bankStatement.findUnique({
        where: { id: statementId },
        include: { lines: true },
      });
      if (!st) return NextResponse.json({ error: "Statement tidak ditemukan" }, { status: 404 });

      const belum = st.lines.filter((l) => l.status === "belum").length;
      if (belum > 0) {
        return NextResponse.json({ error: `Masih ada ${belum} baris belum direkonsiliasi.` }, { status: 400 });
      }
      const movement = st.lines.reduce((s, l) => s + l.kredit - l.debit, 0);
      const selisih = Math.round((st.saldoAkhir - (st.saldoAwal + movement)) * 100) / 100;
      if (Math.abs(selisih) > 1) {
        return NextResponse.json({ error: `Saldo tidak cocok (selisih ${selisih}). Periksa saldo awal/akhir.` }, { status: 400 });
      }

      await prisma.bankStatement.update({ where: { id: statementId }, data: { status: "selesai" } });
      await logAudit(session, "settle", "rekonsiliasi", `Rekonsiliasi selesai · ${st.namaFile ?? statementId} (selisih 0)`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal memproses" }, { status: 500 });
  }
}
