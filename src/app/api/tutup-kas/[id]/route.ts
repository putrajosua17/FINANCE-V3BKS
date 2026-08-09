import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { formatRupiah } from "@/lib/format";
import { createJournalEntry, loadCoaIndex } from "@/lib/journal";
import { COA_SELISIH_KAS } from "@/lib/coa";

// Setujui tutup kas → posting jurnal selisih ke 6-1900 Selisih Kas.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "finance"].includes(session.role)) {
    return NextResponse.json({ error: "Hanya owner/finance yang dapat menyetujui." }, { status: 403 });
  }
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  if (b.action !== "approve") return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });

  try {
    const closing = await prisma.cashClosing.findUnique({ where: { id }, include: { account: true } });
    if (!closing) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    if (closing.status === "disetujui") return NextResponse.json({ error: "Sudah disetujui." }, { status: 400 });

    await prisma.$transaction(async (db) => {
      let journalEntryId: string | null = null;
      if (Math.abs(closing.selisih) > 0.5) {
        const index = await loadCoaIndex(db);
        const kasCoaId = closing.account.coaId ?? index.get("1-1100");
        const selisihCoaId = index.get(COA_SELISIH_KAS);
        if (!kasCoaId || !selisihCoaId) throw new Error("Akun kas / selisih kas belum dipetakan di COA.");

        const nilai = Math.abs(closing.selisih);
        // selisih > 0 (fisik lebih): Debit Kas, Kredit Selisih Kas (keuntungan)
        // selisih < 0 (fisik kurang): Debit Selisih Kas (beban), Kredit Kas
        const lines =
          closing.selisih > 0
            ? [
                { coaId: kasCoaId, debit: nilai, memo: "Selisih kas (lebih)" },
                { coaId: selisihCoaId, kredit: nilai, memo: "Selisih kas (lebih)" },
              ]
            : [
                { coaId: selisihCoaId, debit: nilai, memo: "Selisih kas (kurang)" },
                { coaId: kasCoaId, kredit: nilai, memo: "Selisih kas (kurang)" },
              ];
        const entry = await createJournalEntry(db, {
          tanggal: closing.tanggal,
          deskripsi: `Selisih kas ${closing.shift} — ${closing.account.nama}`,
          sumber: "opname",
          sumberId: closing.id,
          businessUnitId: closing.businessUnitId,
          createdById: session.id,
          lines,
        });
        journalEntryId = entry.id;
      }
      await db.cashClosing.update({
        where: { id },
        data: { status: "disetujui", disetujuiOlehId: session.id, journalEntryId },
      });
    });

    await logAudit(session, "settle", "cashclosing", `Setujui tutup kas ${closing.shift} · selisih ${formatRupiah(closing.selisih)}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal menyetujui" }, { status: 500 });
  }
}
