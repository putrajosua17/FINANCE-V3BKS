import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { formatRupiah } from "@/lib/format";
import { createJournalEntry, loadCoaIndex } from "@/lib/journal";

const UTANG_USAHA = "2-1100";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const b = await req.json();
    const jumlah = Number(b.jumlah) || 0;
    if (jumlah <= 0) return NextResponse.json({ error: "Jumlah pembayaran tidak valid" }, { status: 400 });
    if (!b.accountId) return NextResponse.json({ error: "Rekening sumber wajib dipilih" }, { status: 400 });

    const inv = await prisma.purchaseInvoice.findUnique({ where: { id } });
    if (!inv) return NextResponse.json({ error: "Faktur tidak ditemukan" }, { status: 404 });
    const sisa = inv.total - inv.terbayar;
    if (jumlah > sisa + 1) return NextResponse.json({ error: `Melebihi sisa utang (${formatRupiah(sisa)})` }, { status: 400 });

    const account = await prisma.account.findUnique({ where: { id: b.accountId } });
    if (!account) return NextResponse.json({ error: "Rekening tidak ditemukan" }, { status: 404 });

    await prisma.$transaction(async (db) => {
      const index = await loadCoaIndex(db);
      const utangId = index.get(UTANG_USAHA);
      const kasId = account.coaId ?? index.get("1-1100");
      if (!utangId || !kasId) throw new Error("Akun COA utang/kas belum dipetakan.");
      await createJournalEntry(db, {
        tanggal: new Date(),
        deskripsi: `Pembayaran utang ${inv.nomor}`,
        sumber: "bill",
        sumberId: inv.id,
        businessUnitId: inv.businessUnitId,
        createdById: session.id,
        lines: [
          { coaId: utangId, debit: jumlah, memo: `Bayar ${inv.nomor}` },
          { coaId: kasId, kredit: jumlah, memo: `Bayar ${inv.nomor}` },
        ],
      });
      const terbayar = inv.terbayar + jumlah;
      await db.purchaseInvoice.update({
        where: { id },
        data: { terbayar, status: terbayar >= inv.total - 1 ? "lunas" : "sebagian" },
      });
    });

    await logAudit(session, "pay", "purchaseinvoice", `${inv.nomor} · ${formatRupiah(jumlah)}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal membayar" }, { status: 500 });
  }
}
