import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { SessionUser } from "./auth";
import { parseV3bksCsv, type ParsedRow } from "./v3bks-import";
import { fingerprint, fileHash, normalize, possibleCorrection } from "./import-review";
import { loadCoaIndex, postJournalForTransaction, reverseJournalEntry } from "./journal";
import { assertPeriodOpen } from "./period-lock";
import { defaultBusinessUnitId } from "./business-unit";

export async function createImport(csv: string, fileName: string, user: SessionUser) {
  const hash = fileHash(csv);
  const exists = await prisma.importBatch.findUnique({ where: { fileHash: hash } });
  if (exists) {
    if (user.role === "admin" && exists.uploadedById !== user.id) throw new Error("File ini sudah diunggah oleh pengguna lain. Hubungi finance.");
    return exists;
  }
  const parsed = parseV3bksCsv(csv);
  if(parsed.errors.length)throw new Error(parsed.errors.slice(0,10).join(" "));
  if (!parsed.rows.length) throw new Error("Tidak ada transaksi terbaca. Gunakan CSV tracker V3BKS.");
  if (parsed.rows.length > 2000) throw new Error("Maksimal 2.000 transaksi per file.");
  const [categories, accounts, old, legacy] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true } }),
    prisma.account.findMany({ where: { isActive: true } }),
    prisma.importLine.findMany({ where: { batch: { status: "approved" }, transactionId: { not: null } } }),
    prisma.transaction.findMany({ where: { deletedAt: null }, include: { category: true, account: true } }),
  ]);
  const previousRows: ParsedRow[] = legacy.map(t => ({ tanggal: t.tanggal.toISOString().slice(0,10), tipe: t.tipe as "income" | "expense", kategori:t.category.nama, akun:t.account.nama, jumlah:t.jumlah, entitas:t.namaEntitas || undefined, kode:t.rateCode || undefined, jam:t.jam || undefined, statusBayar:t.statusBayar as "dp" | "lunas" | undefined, catatan:t.catatan || undefined }));
  const seen = new Set<string>();
  const lines = parsed.rows.map(row => {
    const fp = fingerprint(row);
    const cat = categories.find(c => c.tipe === row.tipe && normalize(c.nama) === normalize(row.kategori));
    const acc = accounts.find(a => normalize(a.nama) === normalize(row.akun));
    const exact = old.find(x => x.fingerprint === fp) || previousRows.find(x => fingerprint(x) === fp);
    const maybe = old.some(x => possibleCorrection(row, x.payload as ParsedRow)) || previousRows.some(x => possibleCorrection(row,x));
    const repeated = seen.has(fp); seen.add(fp);
    return { sourceRow: row.sourceRow || 0, payload: row as Prisma.InputJsonValue, fingerprint: fp,
      categoryId: cat?.id, accountId: acc?.id,
      decision: repeated ? "review" : exact ? "skip" : maybe ? "review" : "new",
      issue: repeated ? "Baris identik dalam file: periksa apakah dua pembayaran berbeda." : maybe && !exact ? "Ada transaksi sebelumnya yang mirip. Pilih transaksi baru atau koreksi." : null,
    };
  });
  return prisma.importBatch.create({ data: { csv, fileName: fileName.slice(0, 200), fileHash: hash,
    uploadedById: user.id, uploadedByName: user.nama, lines: { create: lines } } });
}

export async function approveImport(id: string, user: SessionUser) {
  return prisma.$transaction(async db => {
    // Serialize imports and journal numbering across concurrent approvals.
    await db.$executeRaw`SELECT pg_advisory_xact_lock(7300601)`;
    const batch = await db.importBatch.findUnique({ where: { id }, include: { lines: true } });
    if (!batch || batch.status !== "submitted") throw new Error("Impor tidak sedang menunggu persetujuan.");
    const bu = await defaultBusinessUnitId(db);
    const index = await loadCoaIndex(db);
    const replaced = new Set<string>();
    for (const line of batch.lines) {
      if (line.decision === "skip") continue;
      if (!["new", "replace"].includes(line.decision)) throw new Error(`Baris ${line.sourceRow}: keputusan belum lengkap.`);
      const row = line.payload as ParsedRow;
      if (!line.categoryId || !line.accountId) throw new Error(`Baris ${line.sourceRow}: kategori/rekening wajib dipetakan.`);
      const [category, account] = await Promise.all([
        db.category.findUnique({ where: { id: line.categoryId } }), db.account.findUnique({ where: { id: line.accountId } }),
      ]);
      if (!category?.isActive || category.tipe !== row.tipe || !account?.isActive) throw new Error("Pemetaan kategori/rekening tidak valid.");
      const tanggal = new Date(row.tanggal + "T04:00:00Z");
      if(account.openingDate && tanggal < account.openingDate) throw new Error(`Baris ${line.sourceRow} mendahului tanggal saldo awal rekening.`);
      await assertPeriodOpen(db, tanggal, bu);
      const matched = await db.importLine.findFirst({ where: { fingerprint: line.fingerprint, batch: { status: "approved" }, transactionId: { not: null } } });
      if (matched && line.decision === "new") throw new Error(`Baris ${line.sourceRow} sudah disetujui pada impor lain. Muat ulang dan lewati baris tersebut.`);
      let bookingId: string | null = null;
      if (line.decision === "replace") {
        if (!line.replacesId || replaced.has(line.replacesId)) throw new Error("Transaksi koreksi harus unik dan dipilih.");
        const old = await db.transaction.findUnique({ where: { id: line.replacesId } });
        if (!old || old.deletedAt) throw new Error("Transaksi yang dikoreksi sudah berubah. Periksa ulang.");
        bookingId = old.bookingId;
        await assertPeriodOpen(db, old.tanggal, old.businessUnitId);
        if (old.journalEntryId) await reverseJournalEntry(db, old.journalEntryId, { tanggal: old.tanggal, createdById: user.id });
        await db.bankStatementLine.updateMany({ where: { transactionId: old.id }, data: { transactionId: null, status: "belum", skorCocok: null } });
        await db.transaction.update({ where: { id: old.id }, data: { deletedAt: new Date(), deletedById: user.id } });
        replaced.add(old.id);
      }
      const tx = await db.transaction.create({ data: {
        bookingId, tanggal, tipe: row.tipe, jumlah: row.jumlah, categoryId: category.id, accountId: account.id,
        businessUnitId: bu, createdById: batch.uploadedById, catatan: row.catatan,
        namaEntitas: row.entitas, noHp: row.noHp, rateCode: row.kode, jam: row.jam, durasi: row.durasi,
        tanggalMain: row.tanggalMain ? new Date(row.tanggalMain + "T04:00:00Z") : null,
        statusBayar: row.statusBayar, dp: row.statusBayar === "dp" ? row.jumlah : null,
        tempatBeli: row.tempatBeli,
        pajakDaerah: row.tipe === "income" && normalize(category.nama) === "rental" ? Math.round(row.jumlah / 11) : 0,
      } });
      await postJournalForTransaction(db, tx.id, index);
      if (bookingId) {
        const booking = await db.booking.findUnique({where:{id:bookingId}});
        const total = await db.transaction.aggregate({where:{bookingId,deletedAt:null},_sum:{jumlah:true}});
        const paid = total._sum.jumlah || 0;
        if (booking) await db.booking.update({where:{id:bookingId},data:{dp:paid,sisaPelunasan:booking.harga>0?Math.max(0,booking.harga-paid):0,status:booking.harga>0&&paid>=booking.harga?"lunas":"dp"}});
      }
      await db.importLine.update({ where: { id: line.id }, data: { transactionId: tx.id } });
    }
    await db.auditLog.create({ data: { userId: user.id, userName: user.nama, aksi: "approve", entitas: "import", detail: `Menyetujui ${batch.fileName} (${id})` } });
    return db.importBatch.update({ where: { id }, data: { status: "approved", reviewedById: user.id, reviewedAt: new Date() } });
  }, { maxWait: 15000, timeout: 120000 });
}
