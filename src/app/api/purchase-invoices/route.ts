import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { formatRupiah } from "@/lib/format";
import { createJournalEntry, loadCoaIndex } from "@/lib/journal";
import { COA_FALLBACK_BEBAN } from "@/lib/coa";

const UTANG_USAHA = "2-1100";
const UTANG_PPH23 = "2-1330";

async function nextInvoiceNumber(tanggal: Date): Promise<string> {
  const yyyy = tanggal.getFullYear();
  const prefix = `PI-${yyyy}-`;
  const last = await prisma.purchaseInvoice.findFirst({
    where: { nomor: { startsWith: prefix } },
    orderBy: { nomor: "desc" },
    select: { nomor: true },
  });
  const seq = last ? parseInt(last.nomor.slice(prefix.length), 10) || 0 : 0;
  return `${prefix}${String(seq + 1).padStart(4, "0")}`;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    if (!b.vendorId) return NextResponse.json({ error: "Vendor wajib dipilih" }, { status: 400 });
    const subtotal = Number(b.subtotal) || 0;
    if (subtotal <= 0) return NextResponse.json({ error: "Subtotal tidak valid" }, { status: 400 });
    const ppn = Number(b.ppn) || 0;
    const pphDipotong = Number(b.pphDipotong) || 0;
    const total = subtotal + ppn - pphDipotong;
    const tanggal = b.tanggal ? new Date(b.tanggal) : new Date();
    const jatuhTempo = b.jatuhTempo ? new Date(b.jatuhTempo) : tanggal;
    const coaBebanKode = b.coaBebanKode || COA_FALLBACK_BEBAN;

    const inv = await prisma.$transaction(async (db) => {
      const nomor = await nextInvoiceNumber(tanggal);
      const index = await loadCoaIndex(db);
      const bebanId = index.get(coaBebanKode);
      const utangId = index.get(UTANG_USAHA);
      const pphId = index.get(UTANG_PPH23);
      if (!bebanId || !utangId || !pphId) throw new Error("Akun COA (beban/utang/PPh23) belum di-seed.");

      const lines = [
        { coaId: bebanId, debit: subtotal + ppn, memo: b.keterangan || "Pembelian" },
        { coaId: utangId, kredit: total, memo: "Utang usaha" },
      ];
      if (pphDipotong > 0) lines.push({ coaId: pphId, kredit: pphDipotong, memo: "PPh 23 dipotong" });

      const entry = await createJournalEntry(db, {
        tanggal,
        deskripsi: `Faktur pembelian ${nomor}`,
        sumber: "bill",
        businessUnitId: b.businessUnitId || null,
        createdById: session.id,
        lines,
      });
      return db.purchaseInvoice.create({
        data: {
          nomor,
          vendorId: b.vendorId,
          tanggal,
          jatuhTempo,
          keterangan: b.keterangan || null,
          coaBebanKode,
          subtotal,
          ppn,
          pphDipotong,
          total,
          status: "belum",
          businessUnitId: b.businessUnitId || null,
          journalEntryId: entry.id,
        },
      });
    });

    await logAudit(session, "create", "purchaseinvoice", `${inv.nomor} · ${formatRupiah(total)}`);
    return NextResponse.json({ ok: true, id: inv.id, nomor: inv.nomor });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal menyimpan faktur" }, { status: 500 });
  }
}
