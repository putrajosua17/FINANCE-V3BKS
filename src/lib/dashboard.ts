import { prisma } from "@/lib/prisma";

export type Periode = "ini" | "lalu";

// Bulan aktif mengikuti kalender berjalan: "Bulan Ini" = bulan sekarang,
// "Bulan Lalu" = bulan sebelumnya. Otomatis pindah tiap ganti bulan.
export function rangeBulan(periode: Periode) {
  const now = new Date();
  let tahun = now.getFullYear();
  let bulan = now.getMonth();
  if (periode === "lalu") {
    bulan -= 1;
    if (bulan < 0) { bulan = 11; tahun -= 1; }
  }
  const start = new Date(tahun, bulan, 1, 0, 0, 0);
  const end = new Date(tahun, bulan + 1, 1, 0, 0, 0);
  return { start, end, bulan, tahun };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getDashboardData(periode: Periode) {
  const { start, end, bulan, tahun } = rangeBulan(periode);

  const [txMonth, accounts, allTx, pendingBills, piutang, targets] = await Promise.all([
    prisma.transaction.findMany({
      where: { tanggal: { gte: start, lt: end }, deletedAt: null },
      include: { category: true, account: true },
      orderBy: { tanggal: "asc" },
    }),
    prisma.account.findMany({ orderBy: { urutan: "asc" } }),
    prisma.transaction.findMany({ where: { deletedAt: null }, select: { tipe: true, jumlah: true, accountId: true } }),
    prisma.bill.findMany({ where: { status: "pending" }, include: { category: true }, orderBy: { jatuhTempo: "asc" } }),
    prisma.booking.findMany({ where: { sisaPelunasan: { gt: 0 }, status: { not: "batal" } }, orderBy: { tanggalMain: "asc" } }),
    prisma.target.findMany({ where: { tanggal: { gte: start, lt: end } } }),
  ]);

  // ---- KPI dasar ----
  const income = txMonth.filter((t) => t.tipe === "income").reduce((s, t) => s + t.jumlah, 0);
  const expense = txMonth.filter((t) => t.tipe === "expense").reduce((s, t) => s + t.jumlah, 0);
  const profit = income - expense;
  const rasioLaba = income > 0 ? (profit / income) * 100 : 0;

  // ---- Saldo rekening (kumulatif seluruh waktu) ----
  const saldoPerAkun = accounts.map((a) => {
    const masuk = allTx.filter((t) => t.accountId === a.id && t.tipe === "income").reduce((s, t) => s + t.jumlah, 0);
    const keluar = allTx.filter((t) => t.accountId === a.id && t.tipe === "expense").reduce((s, t) => s + t.jumlah, 0);
    return { id: a.id, nama: a.nama, tipe: a.tipe, saldo: a.saldoAwal + masuk - keluar };
  });
  const totalSaldo = saldoPerAkun.reduce((s, a) => s + a.saldo, 0);

  // ---- Tagihan & piutang ----
  const totalTagihan = pendingBills.reduce((s, b) => s + b.nominalEstimasi, 0);
  const totalPiutang = piutang.reduce((s, b) => s + b.sisaPelunasan, 0);

  // ---- Nilai kekayaan (net worth) = saldo kas + piutang - tagihan pending ----
  const nilaiKekayaan = totalSaldo + totalPiutang - totalTagihan;

  // ---- Arus kas harian ----
  const hariDalamBulan = new Date(tahun, bulan + 1, 0).getDate();
  const arusKas = Array.from({ length: hariDalamBulan }, (_, i) => ({
    hari: i + 1,
    income: 0,
    expense: 0,
    net: 0,
  }));
  for (const t of txMonth) {
    const idx = new Date(t.tanggal).getDate() - 1;
    if (idx < 0 || idx >= arusKas.length) continue;
    if (t.tipe === "income") arusKas[idx].income += t.jumlah;
    else arusKas[idx].expense += t.jumlah;
  }
  arusKas.forEach((r) => (r.net = r.income - r.expense));

  // ---- Rincian pengeluaran per kategori ----
  const expByCat = new Map<string, number>();
  for (const t of txMonth.filter((t) => t.tipe === "expense")) {
    expByCat.set(t.category.nama, (expByCat.get(t.category.nama) ?? 0) + t.jumlah);
  }
  const rincianPengeluaran = Array.from(expByCat.entries())
    .map(([nama, nilai]) => ({ nama, nilai, persen: expense > 0 ? (nilai / expense) * 100 : 0 }))
    .sort((a, b) => b.nilai - a.nilai);

  // ---- Rincian pemasukan per kategori (untuk laporan/insight) ----
  const incByCat = new Map<string, number>();
  for (const t of txMonth.filter((t) => t.tipe === "income")) {
    incByCat.set(t.category.nama, (incByCat.get(t.category.nama) ?? 0) + t.jumlah);
  }
  const rincianPemasukan = Array.from(incByCat.entries())
    .map(([nama, nilai]) => ({ nama, nilai, persen: income > 0 ? (nilai / income) * 100 : 0 }))
    .sort((a, b) => b.nilai - a.nilai);

  // ---- Tren bulanan (Jan-Des dari seluruh transaksi tahun aktif) ----
  const allYearTx = await prisma.transaction.findMany({
    where: { tanggal: { gte: new Date(tahun, 0, 1), lt: new Date(tahun + 1, 0, 1) }, deletedAt: null },
    select: { tanggal: true, tipe: true, jumlah: true },
  });
  const tren = Array.from({ length: 12 }, (_, i) => ({ bulan: i, income: 0, expense: 0, profit: 0 }));
  for (const t of allYearTx) {
    const m = new Date(t.tanggal).getMonth();
    if (t.tipe === "income") tren[m].income += t.jumlah;
    else tren[m].expense += t.jumlah;
  }
  tren.forEach((r) => (r.profit = r.income - r.expense));
  const trenAktif = tren.filter((r) => r.income > 0 || r.expense > 0);

  // ---- Target progress ----
  const targetBulanan = targets.find((t) => t.periode === "bulanan")?.nilai ?? 0;
  const targetHarian = targets.find((t) => t.periode === "harian")?.nilai ?? 6000000;
  // Hari acuan = tanggal transaksi terbaru di bulan ini (fallback hari ini)
  const tglTerbaru = txMonth.length
    ? new Date(txMonth[txMonth.length - 1].tanggal)
    : new Date(tahun, bulan, 1);
  const hariAcuan = tglTerbaru.getDate();
  const realisasiHari = arusKas[hariAcuan - 1]?.income ?? 0;

  const progresTarget = {
    harian: {
      target: targetHarian,
      realisasi: realisasiHari,
      persen: targetHarian > 0 ? (realisasiHari / targetHarian) * 100 : 0,
      hari: hariAcuan,
    },
    bulanan: {
      target: targetBulanan,
      realisasi: income,
      persen: targetBulanan > 0 ? (income / targetBulanan) * 100 : 0,
    },
  };

  // ---- Tagihan mendatang (bills + piutang), 6 terdekat ----
  const tagihanMendatang = [
    ...pendingBills.map((b) => ({
      jenis: "tagihan" as const,
      nama: b.nama,
      nominal: b.nominalEstimasi,
      tanggal: b.jatuhTempo,
    })),
    ...piutang.map((p) => ({
      jenis: "piutang" as const,
      nama: `Pelunasan · ${p.namaEntitas}`,
      nominal: p.sisaPelunasan,
      tanggal: p.tanggalMain,
    })),
  ]
    .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
    .slice(0, 6);

  // ---- Status keuangan (skor) ----
  let skor = 50;
  if (rasioLaba >= 30) skor += 25;
  else if (rasioLaba >= 15) skor += 15;
  else if (rasioLaba >= 0) skor += 5;
  else skor -= 15;
  if (progresTarget.bulanan.persen >= 80) skor += 20;
  else if (progresTarget.bulanan.persen >= 40) skor += 10;
  if (totalSaldo > totalTagihan) skor += 15;
  else skor -= 10;
  skor = Math.max(0, Math.min(100, skor));
  const statusLabel = skor >= 75 ? "Healthy" : skor >= 50 ? "Waspada" : "Berisiko";

  // ---- FlowAI insights (rule-based) ----
  const insights: string[] = [];
  if (rincianPengeluaran[0]) {
    insights.push(
      `Kategori "${rincianPengeluaran[0].nama}" adalah pengeluaran terbesar (${rincianPengeluaran[0].persen.toFixed(1)}%).`
    );
  }
  if (progresTarget.bulanan.persen > 0) {
    insights.push(
      `Realisasi target bulanan ${progresTarget.bulanan.persen.toFixed(1)}% — sisa Rp${Math.max(0, targetBulanan - income).toLocaleString("id-ID")} menuju target.`
    );
  }
  if (totalPiutang > 0) {
    insights.push(
      `Ada ${piutang.length} pelunasan tertunda senilai Rp${totalPiutang.toLocaleString("id-ID")} yang perlu ditagih.`
    );
  }
  if (rasioLaba < 0) {
    insights.push("Rasio laba negatif bulan ini — pengeluaran melebihi pemasukan.");
  }

  return {
    periode,
    bulan,
    tahun,
    kpi: { totalSaldo, income, expense, profit, rasioLaba, nilaiKekayaan, skor, statusLabel },
    saldoPerAkun,
    totalTagihan,
    totalPiutang,
    jumlahTagihan: pendingBills.length + piutang.length,
    arusKas,
    rincianPengeluaran,
    rincianPemasukan,
    tren: trenAktif,
    progresTarget,
    tagihanMendatang,
    insights,
  };
}
