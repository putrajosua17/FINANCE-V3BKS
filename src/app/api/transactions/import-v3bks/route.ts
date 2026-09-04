import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { parseV3bksCsv } from "@/lib/v3bks-import";
import { loadCoaIndex, postJournalForTransaction, reverseJournalEntry } from "@/lib/journal";
import { assertPeriodOpen, PeriodLockedError } from "@/lib/period-lock";
import { defaultBusinessUnitId } from "@/lib/business-unit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { csv, replace } = await req.json();
    if (!csv || typeof csv !== "string") {
      return NextResponse.json({ error: "CSV kosong" }, { status: 400 });
    }

    const parsed = parseV3bksCsv(csv);
    if (parsed.rows.length === 0) {
      return NextResponse.json({ error: "Tidak ada baris valid terbaca dari CSV" }, { status: 400 });
    }

    const [categories, accounts] = await Promise.all([
      prisma.category.findMany(),
      prisma.account.findMany(),
    ]);
    const findCat = (nama: string, tipe: string) =>
      categories.find((c) => c.tipe === tipe && c.nama.toLowerCase() === nama.trim().toLowerCase());
    const findAcc = (nama: string) => accounts.find((a) => a.nama.toLowerCase() === nama.trim().toLowerCase());

    const toCreate: Parameters<typeof prisma.transaction.create>[0]["data"][] = [];
    const errors: { pesan: string }[] = [];
    const unmatchedCats = new Set<string>();

    const businessUnitId = await defaultBusinessUnitId();
    for (const row of parsed.rows) {
      const cat = findCat(row.kategori, row.tipe);
      if (!cat) { unmatchedCats.add(`${row.kategori} (${row.tipe})`); continue; }
      const acc = findAcc(row.akun) ?? accounts.find((a) => a.nama === "Cash") ?? accounts[0];
      if (!acc) { errors.push({ pesan: `Rekening tidak ada` }); continue; }

      const isRental = cat.nama.toLowerCase() === "rental";
      toCreate.push({
        tanggal: new Date(row.tanggal + "T08:00:00"),
        tipe: row.tipe,
        jumlah: row.jumlah,
        categoryId: cat.id,
        accountId: acc.id,
        businessUnitId,
        catatan: row.catatan || null,
        createdById: session.id,
        ...(row.tipe === "income"
          ? {
              rateCode: row.kode || null,
              jam: row.jam || null,
              durasi: row.durasi ?? null,
              namaEntitas: row.entitas || null,
              noHp: row.noHp || null,
              statusBayar: row.statusBayar || "lunas",
              pajakDaerah: isRental ? Math.round((row.jumlah / 1.1) * 0.1) : 0,
            }
          : {}),
      });
    }

    // Jangan tampilkan impor sebagai berhasil bila ada kategori yang belum
    // dipetakan. Validasi dilakukan sebelum transaksi lama disentuh.
    if (unmatchedCats.size > 0) {
      return NextResponse.json({
        error: "Ada kategori CSV yang belum tersedia di aplikasi",
        unmatchedCategories: Array.from(unmatchedCats),
      }, { status: 422 });
    }

    const months = new Set(parsed.rows.map((r) => r.tanggal.slice(0, 7))); // "YYYY-MM"
    for (const ym of months) {
      const [y, m] = ym.split("-").map(Number);
      await assertPeriodOpen(prisma, new Date(y, m - 1, 1), businessUnitId);
    }

    // Sinkronisasi dilakukan atomik. Data lama tidak dihapus permanen: jurnal
    // dibalik, pasangan rekonsiliasi dilepas, lalu transaksi di-soft-delete.
    // Dengan begitu histori tetap dapat diaudit dan kegagalan di tengah proses
    // tidak meninggalkan laporan dalam keadaan setengah terbarui.
    const result = await prisma.$transaction(async (db) => {
      let replaced = 0;
      if (replace) {
        for (const ym of months) {
          const [y, m] = ym.split("-").map(Number);
          const start = new Date(y, m - 1, 1);
          const end = new Date(y, m, 1);
          const old = await db.transaction.findMany({
            where: { tanggal: { gte: start, lt: end }, deletedAt: null },
            select: { id: true, tanggal: true, journalEntryId: true },
          });
          if (old.length === 0) continue;
          const ids = old.map((tx) => tx.id);
          await db.bankStatementLine.updateMany({
            where: { transactionId: { in: ids } },
            data: { transactionId: null, status: "belum", skorCocok: null },
          });
          for (const tx of old) {
            if (tx.journalEntryId) {
              await reverseJournalEntry(db, tx.journalEntryId, { tanggal: tx.tanggal, createdById: session.id });
            }
          }
          const soft = await db.transaction.updateMany({
            where: { id: { in: ids } },
            data: { deletedAt: new Date(), deletedById: session.id },
          });
          replaced += soft.count;
        }
      }

      const coaIndex = await loadCoaIndex(db);
      let created = 0;
      for (const data of toCreate) {
        const tx = await db.transaction.create({ data });
        await postJournalForTransaction(db, tx.id, coaIndex);
        created++;
      }
      return { created, replaced };
    }, { maxWait: 10_000, timeout: 120_000 });

    const created = result.created;
    const deleted = result.replaced;

    if (created > 0 || deleted > 0) {
      await logAudit(session, "import", "transaction", `Impor V3BKS: ${created} masuk${replace ? `, ${deleted} lama diganti` : ""}`);
    }

    return NextResponse.json({
      ok: true,
      created,
      deleted,
      replace: !!replace,
      income: parsed.rows.filter((r) => r.tipe === "income").length,
      expense: parsed.rows.filter((r) => r.tipe === "expense").length,
      totalIncome: parsed.totalIncome,
      totalExpense: parsed.totalExpense,
      skippedBelumBayar: parsed.skippedIncome,
      unmatchedCategories: Array.from(unmatchedCats),
      errors,
    });
  } catch (e) {
    if (e instanceof PeriodLockedError) return NextResponse.json({ error: e.message }, { status: 423 });
    console.error("[import-v3bks] gagal", e);
    return NextResponse.json({ error: "Gagal memproses impor V3BKS", detail: String(e).slice(0, 200) }, { status: 500 });
  }
}
