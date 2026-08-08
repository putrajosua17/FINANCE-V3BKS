import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type InRow = {
  tanggal?: string;
  tipe?: string;
  kategori?: string;
  jumlah?: string | number;
  rekening?: string;
  keterangan?: string;
  kode?: string;
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const rows: InRow[] = Array.isArray(body.rows) ? body.rows : [];
    if (rows.length === 0) return NextResponse.json({ error: "Tidak ada baris" }, { status: 400 });
    if (rows.length > 1000) return NextResponse.json({ error: "Maksimal 1000 baris per impor" }, { status: 400 });

    const [categories, accounts] = await Promise.all([
      prisma.category.findMany(),
      prisma.account.findMany(),
    ]);
    const findCat = (nama: string, tipe: string) =>
      categories.find((c) => c.tipe === tipe && c.nama.toLowerCase() === nama.trim().toLowerCase());
    const findAcc = (nama: string) => accounts.find((a) => a.nama.toLowerCase() === nama.trim().toLowerCase());

    const errors: { baris: number; pesan: string }[] = [];
    const toCreate: Parameters<typeof prisma.transaction.create>[0]["data"][] = [];

    rows.forEach((r, i) => {
      const baris = i + 1;
      const tipe = (r.tipe || "").toString().trim().toLowerCase();
      const tipeNorm = tipe.startsWith("mas") || tipe === "income" ? "income" : tipe.startsWith("kel") || tipe === "expense" ? "expense" : "";
      if (!tipeNorm) return errors.push({ baris, pesan: "Tipe harus income/expense (masuk/keluar)" });

      const jumlah = Number(String(r.jumlah ?? "").replace(/[^0-9.-]/g, ""));
      if (!jumlah || jumlah <= 0) return errors.push({ baris, pesan: "Jumlah tidak valid" });

      const cat = findCat(r.kategori || "", tipeNorm);
      if (!cat) return errors.push({ baris, pesan: `Kategori "${r.kategori}" tidak ditemukan (${tipeNorm})` });

      const acc = findAcc(r.rekening || "");
      if (!acc) return errors.push({ baris, pesan: `Rekening "${r.rekening}" tidak ditemukan` });

      const tgl = r.tanggal ? new Date(r.tanggal) : new Date();
      if (Number.isNaN(tgl.getTime())) return errors.push({ baris, pesan: `Tanggal "${r.tanggal}" tidak valid` });

      const isRental = cat.nama.toLowerCase() === "rental";
      toCreate.push({
        tanggal: tgl,
        tipe: tipeNorm,
        jumlah,
        categoryId: cat.id,
        accountId: acc.id,
        createdById: session.id,
        catatan: r.keterangan || null,
        ...(tipeNorm === "income"
          ? {
              rateCode: r.kode || null,
              namaEntitas: r.keterangan || null,
              statusBayar: "lunas",
              pajakDaerah: isRental ? Math.round((jumlah / 1.1) * 0.1) : 0,
            }
          : { tempatBeli: r.keterangan || null }),
      });
    });

    let created = 0;
    if (toCreate.length > 0) {
      const result = await prisma.$transaction(toCreate.map((data) => prisma.transaction.create({ data })));
      created = result.length;
    }

    if (created > 0) await logAudit(session, "import", "transaction", `${created} transaksi diimpor (${errors.length} gagal)`);
    return NextResponse.json({ ok: true, created, gagal: errors.length, errors });
  } catch {
    return NextResponse.json({ error: "Gagal memproses impor" }, { status: 500 });
  }
}
