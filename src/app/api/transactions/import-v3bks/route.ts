import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { parseV3bksCsv } from "@/lib/v3bks-import";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { csv } = await req.json();
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

    let created = 0;
    if (toCreate.length > 0) {
      // Batch agar aman untuk banyak baris
      for (let i = 0; i < toCreate.length; i += 50) {
        const batch = toCreate.slice(i, i + 50);
        await prisma.$transaction(batch.map((data) => prisma.transaction.create({ data })));
        created += batch.length;
      }
    }

    if (created > 0) await logAudit(session, "import", "transaction", `Impor V3BKS: ${created} transaksi`);

    return NextResponse.json({
      ok: true,
      created,
      income: parsed.rows.filter((r) => r.tipe === "income").length,
      expense: parsed.rows.filter((r) => r.tipe === "expense").length,
      totalIncome: parsed.totalIncome,
      totalExpense: parsed.totalExpense,
      skippedBelumBayar: parsed.skippedIncome,
      unmatchedCategories: Array.from(unmatchedCats),
      errors,
    });
  } catch (e) {
    return NextResponse.json({ error: "Gagal memproses impor V3BKS", detail: String(e).slice(0, 200) }, { status: 500 });
  }
}
