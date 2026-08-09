import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { formatRupiah } from "@/lib/format";
import { postJournalForTransaction } from "@/lib/journal";
import { assertPeriodOpen, PeriodLockedError } from "@/lib/period-lock";
import { defaultBusinessUnitId } from "@/lib/business-unit";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tipe = searchParams.get("tipe") || undefined;
  const q = searchParams.get("q") || undefined;
  const buId = searchParams.get("bu") || undefined;
  const take = Math.min(Number(searchParams.get("take") || 100), 500);

  // F-05: sembunyikan transaksi yang telah di-soft-delete.
  const where: Record<string, unknown> = { deletedAt: null };
  if (tipe === "income" || tipe === "expense") where.tipe = tipe;
  if (buId) where.businessUnitId = buId;
  if (q) {
    where.OR = [
      { namaEntitas: { contains: q } },
      { catatan: { contains: q } },
      { noHp: { contains: q } },
      { tempatBeli: { contains: q } },
    ];
  }

  const items = await prisma.transaction.findMany({
    where,
    include: { category: true, account: true },
    orderBy: { tanggal: "desc" },
    take,
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await req.json();
    const tipe = b.tipe === "expense" ? "expense" : "income";
    const jumlah = Number(b.jumlah);
    if (!jumlah || jumlah <= 0) return NextResponse.json({ error: "Jumlah tidak valid" }, { status: 400 });
    if (!b.categoryId) return NextResponse.json({ error: "Kategori wajib dipilih" }, { status: 400 });
    if (!b.accountId) return NextResponse.json({ error: "Rekening wajib dipilih" }, { status: 400 });

    const tanggal = b.tanggal ? new Date(b.tanggal) : new Date();

    // F-05: tolak bila periode telah dikunci.
    await assertPeriodOpen(prisma, tanggal, b.businessUnitId || undefined);

    // Pajak Daerah 10% otomatis untuk kategori Rental
    const cat = await prisma.category.findUnique({ where: { id: b.categoryId } });
    const isRental = cat?.nama?.toLowerCase() === "rental";
    const pajakDaerah = tipe === "income" && isRental ? Math.round((jumlah / 1.1) * 0.1) : 0;

    // F-07: unit bisnis (default V3BKS-MS bila tidak dikirim form).
    const businessUnitId = b.businessUnitId || (await defaultBusinessUnitId());

    // F-01: transaksi + jurnal double-entry dibentuk atomik.
    const tx = await prisma.$transaction(async (db) => {
      const created = await db.transaction.create({
        data: {
          tanggal,
          tipe,
          jumlah,
          catatan: b.catatan || null,
          categoryId: b.categoryId,
          accountId: b.accountId,
          businessUnitId,
          createdById: session.id,
          ...(tipe === "income"
            ? {
                rateCode: b.rateCode || null,
                jam: b.jam || null,
                durasi: b.durasi ? Number(b.durasi) : null,
                tanggalMain: b.tanggalMain ? new Date(b.tanggalMain) : null,
                namaEntitas: b.namaEntitas || null,
                noHp: b.noHp || null,
                dp: b.dp ? Number(b.dp) : null,
                pelunasan: b.pelunasan ? Number(b.pelunasan) : null,
                statusBayar: b.statusBayar || "lunas",
                pajakDaerah,
              }
            : {
                tempatBeli: b.tempatBeli || null,
              }),
        },
      });
      await postJournalForTransaction(db, created.id);
      return created;
    });

    await logAudit(session, "create", "transaction", `${tipe} ${formatRupiah(jumlah)} · ${cat?.nama ?? ""}`, {
      nilaiBaru: { tipe, jumlah, kategori: cat?.nama, tanggal },
    });
    return NextResponse.json({ ok: true, id: tx.id });
  } catch (e) {
    if (e instanceof PeriodLockedError) return NextResponse.json({ error: e.message }, { status: 423 });
    return NextResponse.json({ error: "Gagal menyimpan transaksi" }, { status: 500 });
  }
}
