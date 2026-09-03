import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getDashboardData, rangeBulan, type Periode } from "@/lib/dashboard";
import { getBudgetComparison } from "@/lib/budget";
import { namaBulan } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const periode: Periode = searchParams.get("periode") === "lalu" ? "lalu" : "ini";
  const { start, end, bulan, tahun } = rangeBulan(periode);

  const [d, budget, txMonth] = await Promise.all([
    getDashboardData(periode),
    getBudgetComparison(periode),
    prisma.transaction.findMany({
      where: { tanggal: { gte: start, lt: end }, deletedAt: null },
      include: { category: true, account: true },
      orderBy: { tanggal: "asc" },
    }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "V3BKS FinanceFlow";
  wb.created = new Date();

  const rupiah = '"Rp"#,##0';
  const headerFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF16A34A" } };
  const styleHeader = (row: ExcelJS.Row) => {
    row.eachCell((c) => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = headerFill;
    });
  };

  // ---- Sheet 1: Ringkasan P&L ----
  const s1 = wb.addWorksheet("Ringkasan");
  s1.addRow([`Laporan Keuangan V3BKS Mini Soccer — ${namaBulan(bulan, true)} ${tahun}`]);
  s1.getRow(1).font = { bold: true, size: 14 };
  s1.addRow([]);
  const h1 = s1.addRow(["Bulan", "Pemasukan", "Pengeluaran", "Profit"]);
  styleHeader(h1);
  for (const r of d.tren) {
    s1.addRow([namaBulan(r.bulan, true), r.income, r.expense, r.profit]);
  }
  const totIn = d.tren.reduce((s, r) => s + r.income, 0);
  const totOut = d.tren.reduce((s, r) => s + r.expense, 0);
  const totRow = s1.addRow(["TOTAL", totIn, totOut, totIn - totOut]);
  totRow.font = { bold: true };
  s1.getColumn(2).numFmt = rupiah;
  s1.getColumn(3).numFmt = rupiah;
  s1.getColumn(4).numFmt = rupiah;
  s1.columns.forEach((c) => (c.width = 20));

  // ---- Sheet 2: Kategori ----
  const s2 = wb.addWorksheet("Kategori");
  const h2a = s2.addRow(["PEMASUKAN per Kategori", "Nilai", "%"]);
  styleHeader(h2a);
  for (const r of d.rincianPemasukan) s2.addRow([r.nama, r.nilai, `${r.persen.toFixed(1)}%`]);
  s2.addRow([]);
  const h2b = s2.addRow(["PENGELUARAN per Kategori", "Nilai", "%"]);
  styleHeader(h2b);
  for (const r of d.rincianPengeluaran) s2.addRow([r.nama, r.nilai, `${r.persen.toFixed(1)}%`]);
  s2.getColumn(2).numFmt = rupiah;
  s2.columns.forEach((c) => (c.width = 28));

  // ---- Sheet 3: Anggaran ----
  const s3 = wb.addWorksheet("Anggaran");
  const h3 = s3.addRow(["Kategori", "Anggaran", "Realisasi", "Sisa", "% Terpakai", "Status"]);
  styleHeader(h3);
  for (const r of budget.rows) {
    s3.addRow([r.nama, r.budget, r.realisasi, r.sisa, `${r.persen.toFixed(1)}%`, r.status]);
  }
  s3.getColumn(2).numFmt = rupiah;
  s3.getColumn(3).numFmt = rupiah;
  s3.getColumn(4).numFmt = rupiah;
  s3.columns.forEach((c) => (c.width = 22));

  // ---- Sheet 4: Transaksi ----
  const s4 = wb.addWorksheet("Transaksi");
  const h4 = s4.addRow(["Tanggal", "Tipe", "Kategori", "Keterangan", "Rekening", "Kode", "Jumlah"]);
  styleHeader(h4);
  for (const t of txMonth) {
    s4.addRow([
      new Date(t.tanggal).toLocaleDateString("id-ID"),
      t.tipe === "income" ? "Masuk" : "Keluar",
      t.category.nama,
      t.namaEntitas || t.tempatBeli || t.catatan || "",
      t.account.nama,
      t.rateCode || "",
      t.jumlah,
    ]);
  }
  s4.getColumn(7).numFmt = rupiah;
  s4.columns.forEach((c, i) => (c.width = i === 3 ? 32 : 16));

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `Laporan_V3BKS_${namaBulan(bulan)}_${tahun}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
