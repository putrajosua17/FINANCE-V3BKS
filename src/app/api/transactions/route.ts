import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { formatRupiah } from "@/lib/format";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tipe = searchParams.get("tipe") || undefined;
  const q = searchParams.get("q") || undefined;
  const take = Math.min(Number(searchParams.get("take") || 100), 500);

  const where: Record<string, unknown> = {};
  if (tipe === "income" || tipe === "expense") where.tipe = tipe;
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

    // Pajak Daerah 10% otomatis untuk kategori Rental
    const cat = await prisma.category.findUnique({ where: { id: b.categoryId } });
    const isRental = cat?.nama?.toLowerCase() === "rental";
    const pajakDaerah = tipe === "income" && isRental ? Math.round((jumlah / 1.1) * 0.1) : 0;

    const tx = await prisma.transaction.create({
      data: {
        tanggal,
        tipe,
        jumlah,
        catatan: b.catatan || null,
        categoryId: b.categoryId,
        accountId: b.accountId,
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
    await logAudit(session, "create", "transaction", `${tipe} ${formatRupiah(jumlah)} · ${cat?.nama ?? ""}`);
    return NextResponse.json({ ok: true, id: tx.id });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan transaksi" }, { status: 500 });
  }
}
