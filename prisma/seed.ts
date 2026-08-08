import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Tanggal Agustus 2026 (month index 7). Pakai jam 08:00 agar aman dari pergeseran TZ.
const d = (day: number) => new Date(2026, 7, day, 8, 0, 0);

async function main() {
  console.log("🌱 Seeding V3BKS FinanceFlow ...");

  // ---- Reset (urutan mempertimbangkan relasi) ----
  await prisma.transaction.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.target.deleteMany();
  await prisma.rateCard.deleteMany();
  await prisma.category.deleteMany();
  await prisma.account.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  // ---- Users (multi-user) ----
  const ownerEmail = process.env.SEED_OWNER_EMAIL || "owner@v3bks.id";
  const ownerPass = process.env.SEED_OWNER_PASSWORD || "owner123";
  await prisma.user.createMany({
    data: [
      { nama: "Owner V3BKS", email: ownerEmail, passwordHash: await bcrypt.hash(ownerPass, 10), role: "owner" },
      { nama: "Admin Operasional", email: "admin@v3bks.id", passwordHash: await bcrypt.hash("admin123", 10), role: "admin" },
      { nama: "Finance", email: "finance@v3bks.id", passwordHash: await bcrypt.hash("finance123", 10), role: "finance" },
    ],
  });
  const owner = await prisma.user.findUnique({ where: { email: ownerEmail } });

  // ---- Accounts / Rekening ----
  const accountsData = [
    { nama: "Cash", tipe: "cash", urutan: 1 },
    { nama: "BCA", tipe: "bank", urutan: 2 },
    { nama: "Mandiri", tipe: "bank", urutan: 3 },
    { nama: "BNI", tipe: "bank", urutan: 4 },
  ];
  await prisma.account.createMany({ data: accountsData });
  const accounts = await prisma.account.findMany();
  const acc = (nama: string) => accounts.find((a) => a.nama === nama)!.id;

  // ---- Categories ----
  const incomeCats = [
    "Rental", "Photographer", "Wasit", "Recording", "New Member",
    "Sewa Rompi", "Fee Samkot 65%", "Event/Turnamen/Poundfit",
    "Pendapatan Lain-lain", "Sponsor",
  ];
  const expenseCats: { nama: string; recurring?: boolean }[] = [
    { nama: "Gaji Karyawan", recurring: true },
    { nama: "PT. LA JALI (Cleaning)", recurring: true },
    { nama: "Fee Photographer" },
    { nama: "Listrik", recurring: true },
    { nama: "Air", recurring: true },
    { nama: "Solar" },
    { nama: "Alat Kebersihan" },
    { nama: "Stock Bola" },
    { nama: "Maintenance" },
    { nama: "WiFi", recurring: true },
    { nama: "Telkomsel", recurring: true },
    { nama: "Other Expenses - 1" },
    { nama: "Other Expenses - 2" },
    { nama: "Football Academy" },
    { nama: "Fee Academy Samkot 35%" },
    { nama: "Marketing" },
    { nama: "Event/Turnamen/Poundfit" },
    { nama: "Pajak", recurring: true },
    { nama: "Bonus/Insentif/THR" },
  ];
  await prisma.category.createMany({
    data: [
      ...incomeCats.map((nama, i) => ({ nama, tipe: "income", urutan: i + 1 })),
      ...expenseCats.map((c, i) => ({ nama: c.nama, tipe: "expense", isRecurring: !!c.recurring, urutan: i + 1 })),
    ],
  });
  const categories = await prisma.category.findMany();
  const cat = (nama: string, tipe: "income" | "expense") =>
    categories.find((c) => c.nama === nama && c.tipe === tipe)!.id;

  // ---- RateCard (master tarif) ----
  await prisma.rateCard.createMany({
    data: [
      // Rental Weekday
      { kode: "WD1", nama: "Weekday 07.00-16.00", kelompok: "RENTAL", hari: "weekday", jamMulai: "07:00", jamSelesai: "16:00", durasi: 1, harga: 600000 },
      { kode: "WD2", nama: "Weekday 16.00-18.00", kelompok: "RENTAL", hari: "weekday", jamMulai: "16:00", jamSelesai: "18:00", durasi: 1, harga: 800000 },
      { kode: "WD3", nama: "Weekday 18.00-23.00", kelompok: "RENTAL", hari: "weekday", jamMulai: "18:00", jamSelesai: "23:00", durasi: 1, harga: 960000 },
      // Rental Weekend
      { kode: "WE1", nama: "Weekend 07.00-16.00", kelompok: "RENTAL", hari: "weekend", jamMulai: "07:00", jamSelesai: "16:00", durasi: 1, harga: 720000 },
      { kode: "WE2", nama: "Weekend 16.00-18.00", kelompok: "RENTAL", hari: "weekend", jamMulai: "16:00", jamSelesai: "18:00", durasi: 1, harga: 960000 },
      { kode: "WE3", nama: "Weekend 18.00-23.00", kelompok: "RENTAL", hari: "weekend", jamMulai: "18:00", jamSelesai: "23:00", durasi: 1, harga: 1040000 },
      // Wasit
      { kode: "WASIT1", nama: "Wasit 1 Jam", kelompok: "WASIT", durasi: 1, harga: 200000 },
      { kode: "WASIT2", nama: "Wasit 2 Jam", kelompok: "WASIT", durasi: 2, harga: 350000 },
      { kode: "WASIT3", nama: "Wasit 3 Jam", kelompok: "WASIT", durasi: 3, harga: 450000 },
      { kode: "WASIT4", nama: "Wasit 4 Jam", kelompok: "WASIT", durasi: 4, harga: 650000 },
      // Photographer
      { kode: "PG1", nama: "Photographer 1 Jam", kelompok: "PHOTOGRAPHER", durasi: 1, harga: 300000 },
      { kode: "PG2", nama: "Photographer 2 Jam", kelompok: "PHOTOGRAPHER", durasi: 2, harga: 500000 },
      { kode: "PG3", nama: "Photographer 3 Jam", kelompok: "PHOTOGRAPHER", durasi: 3, harga: 600000 },
      { kode: "PG4", nama: "Photographer 4 Jam", kelompok: "PHOTOGRAPHER", durasi: 4, harga: 750000 },
      // Rompi
      { kode: "ROMPI1", nama: "Sewa Rompi 1 Set", kelompok: "ROMPI", durasi: 1, harga: 70000 },
      { kode: "ROMPI2", nama: "Sewa Rompi 2 Set", kelompok: "ROMPI", durasi: 2, harga: 100000 },
      // Video
      { kode: "VD1", nama: "Video 1 Jam", kelompok: "VIDEO", durasi: 1, harga: 150000 },
      { kode: "VD2", nama: "Video 2 Jam", kelompok: "VIDEO", durasi: 2, harga: 300000 },
      { kode: "VD3", nama: "Video 3 Jam", kelompok: "VIDEO", durasi: 3, harga: 450000 },
      // Membership (final)
      { kode: "MEMBER-WD", nama: "Member Weekday (Senin-Jumat)", kelompok: "MEMBER", hari: "weekday", harga: 3000000 },
      { kode: "MEMBER-WE", nama: "Member Weekend (Sabtu-Minggu)", kelompok: "MEMBER", hari: "weekend", harga: 3500000 },
    ],
  });

  // ---- Targets ----
  const TARGET_HARIAN = 6000000;
  const targetRows = [];
  for (let day = 1; day <= 31; day++) {
    targetRows.push({ periode: "harian", tanggal: d(day), nilai: TARGET_HARIAN });
  }
  targetRows.push({ periode: "bulanan", tanggal: d(1), nilai: 186000000 });
  await prisma.target.createMany({ data: targetRows });

  // ---- Transaksi Income Agustus (nyata dari PDF) ----
  type Inc = {
    day: number; kategori: string; kode?: string; jam?: string; durasi?: number;
    entitas: string; noHp?: string; jumlah: number; status?: "dp" | "lunas";
    dp?: number; pelunasan?: number; account: string; catatan?: string;
  };
  const incomes: Inc[] = [
    // 1 Aug
    { day: 1, kategori: "Rental", kode: "WE3", jam: "23:00-00:00", entitas: "Rizky Ice Fishing", noHp: "wa.me/083152779014", jumlah: 557000, status: "lunas", account: "BCA" },
    { day: 1, kategori: "Rental", kode: "WD3", jam: "18:00-20:00", entitas: "Andro Kegocek FC", noHp: "wa.me/081254548960", jumlah: 1056000, status: "lunas", account: "BCA" },
    { day: 1, kategori: "Rental", kode: "WE2", jam: "17:00-18:00", entitas: "Rahmat GS 20", noHp: "wa.me/085249665625", jumlah: 700000, status: "lunas", account: "Mandiri" },
    { day: 1, kategori: "Rental", kode: "WE3", jam: "20:00-23:00", durasi: 3, entitas: "Batonk Ramdoor", noHp: "wa.me/082256145544", jumlah: 1214400, status: "lunas", account: "Cash" },
    { day: 1, kategori: "Photographer", kode: "PG3", jam: "20:00-23:00", durasi: 3, entitas: "Batonk Ramdoor", noHp: "wa.me/082256145544", jumlah: 600000, status: "lunas", account: "Cash" },
    // 2 Aug
    { day: 2, kategori: "Rental", kode: "WE1", jam: "08:00-09:00", entitas: "Maarif Genz RT 23", noHp: "wa.me/082353063035", jumlah: 396000, status: "lunas", account: "Mandiri" },
    { day: 2, kategori: "Rental", kode: "WD2", jam: "17:00-18:00", entitas: "Rahmat GS 20", noHp: "wa.me/085249665625", jumlah: 356000, status: "lunas", account: "Mandiri" },
    { day: 2, kategori: "Photographer", kode: "PG1", jam: "17:00-18:00", entitas: "Rahmat GS 20", noHp: "wa.me/085249665625", jumlah: 300000, status: "lunas", account: "Mandiri" },
    // 3 Aug
    { day: 3, kategori: "Wasit", kode: "WASIT1", jam: "21:00-00:00", entitas: "V3BKS", jumlah: 50000, status: "lunas", account: "Cash" },
    { day: 3, kategori: "Rental", kode: "WD3", jam: "21:00-22:00", entitas: "Irfan Filan", noHp: "wa.me/085751816401", jumlah: 528000, status: "lunas", account: "BCA" },
    // 4 Aug
    { day: 4, kategori: "Rental", kode: "WD3", jam: "20:00-21:00", entitas: "Arman KPS", noHp: "wa.me/6282153059990", jumlah: 556000, status: "lunas", account: "Cash" },
    // 5 Aug
    { day: 5, kategori: "Rental", kode: "WD3", jam: "18:00-20:00", durasi: 2, entitas: "Andro Kegocek FC", noHp: "wa.me/081254548960", jumlah: 1056000, status: "lunas", account: "BCA" },
    { day: 5, kategori: "Rental", kode: "WD3", jam: "20:00-21:00", entitas: "Andra IMIPAA", noHp: "wa.me/6281347968519", jumlah: 378000, status: "lunas", account: "Cash" },
    { day: 5, kategori: "Photographer", kode: "PG1", jam: "20:00-21:00", entitas: "Andra IMIPAA", noHp: "wa.me/6281347968519", jumlah: 300000, status: "lunas", account: "Cash" },
    { day: 5, kategori: "Rental", kode: "WD3", jam: "20:00-22:00", durasi: 2, entitas: "Andra IMIPAA (pelunasan)", noHp: "wa.me/6281347968519", jumlah: 678000, status: "lunas", account: "BCA" },
    // 6 Aug
    { day: 6, kategori: "Rental", kode: "WD3", jam: "21:00-22:00", entitas: "Irfan Filan", noHp: "wa.me/085751816401", jumlah: 528000, status: "lunas", account: "BCA" },
    { day: 6, kategori: "Photographer", kode: "PG1", jam: "21:00-22:00", entitas: "Irfan Filan", noHp: "wa.me/085751816401", jumlah: 300000, status: "lunas", account: "BCA" },
    { day: 6, kategori: "Rental", kode: "WD3", jam: "21:00-22:00", entitas: "Shandy JCI SMR (DP)", noHp: "wa.me/085349999091", jumlah: 450000, status: "lunas", account: "Mandiri" },
    // 7 Aug (hari besar)
    { day: 7, kategori: "Rental", kode: "WD3", jam: "21:00-22:00", entitas: "Dimas Tarkam Boy", noHp: "wa.me/6281233162548", jumlah: 528000, status: "lunas", account: "Cash" },
    { day: 7, kategori: "Rental", kode: "WD1", jam: "08:00-16:00", durasi: 8, entitas: "IMIPAS", noHp: "wa.me/089665548962", jumlah: 4488000, status: "lunas", account: "BCA" },
    { day: 7, kategori: "Rental", kode: "WD2", jam: "16:00-18:00", entitas: "IMIPAS", noHp: "wa.me/089665548962", jumlah: 299200, status: "lunas", account: "BCA" },
    { day: 7, kategori: "Rental", kode: "WD2", jam: "17:00-18:00", durasi: 4, entitas: "Sair Pertamina EP", noHp: "wa.me/087811007254", jumlah: 3300000, status: "lunas", account: "Mandiri" },
    { day: 7, kategori: "Rental", kode: "WD3", jam: "19:00-23:00", entitas: "MR JNT 06 (DP)", jumlah: 1750000, status: "lunas", account: "BCA" },
    { day: 7, kategori: "Rental", kode: "WD3", jam: "20:00-22:00", durasi: 2, entitas: "Faisal Kita-kita Aja", noHp: "wa.me/085348991518", jumlah: 1481000, status: "lunas", account: "Mandiri" },
    // 8 Aug
    { day: 8, kategori: "Rental", kode: "WE3", jam: "21:00-23:00", durasi: 2, entitas: "Lambung 09 (DP)", noHp: "wa.me/085738200155", jumlah: 1480000, status: "lunas", account: "Cash" },
    { day: 8, kategori: "Photographer", kode: "PG2", jam: "21:00-23:00", durasi: 2, entitas: "Lambung 09 (DP)", noHp: "wa.me/085738200155", jumlah: 500000, status: "lunas", account: "Cash" },
  ];

  for (const t of incomes) {
    const pajakDaerah = t.kategori === "Rental" ? Math.round((t.jumlah / 1.1) * 0.1) : 0;
    await prisma.transaction.create({
      data: {
        tanggal: d(t.day),
        tipe: "income",
        jumlah: t.jumlah,
        categoryId: cat(t.kategori, "income"),
        accountId: acc(t.account),
        rateCode: t.kode,
        jam: t.jam,
        durasi: t.durasi ?? 1,
        namaEntitas: t.entitas,
        noHp: t.noHp,
        statusBayar: t.status ?? "lunas",
        pajakDaerah,
        catatan: t.catatan,
        createdById: owner?.id,
      },
    });
  }

  // ---- Transaksi Expenses Agustus (nyata dari PDF, total Rp795.200) ----
  const expenses = [
    { day: 2, kategori: "Other Expenses - 1", jumlah: 120000, tempat: "Cash", catatan: "Uang makan mas holil" },
    { day: 3, kategori: "Other Expenses - 1", jumlah: 339400, tempat: "Subur Makmur", catatan: "Head shower 2pcs & baterai A2" },
    { day: 3, kategori: "Other Expenses - 1", jumlah: 50000, tempat: "Spotify", catatan: "Perpanjang langganan Spotify" },
    { day: 3, kategori: "Other Expenses - 1", jumlah: 5000, tempat: "-", catatan: "Parkir mobil" },
    { day: 3, kategori: "Other Expenses - 1", jumlah: 161800, tempat: "Toko", catatan: "Tisu toilet 2pcs & tisu tangan toilet 8" },
    { day: 3, kategori: "Other Expenses - 1", jumlah: 119000, tempat: "Toko", catatan: "4 dus air mineral" },
  ];
  for (const e of expenses) {
    await prisma.transaction.create({
      data: {
        tanggal: d(e.day),
        tipe: "expense",
        jumlah: e.jumlah,
        categoryId: cat(e.kategori, "expense"),
        accountId: acc("Cash"),
        tempatBeli: e.tempat,
        catatan: e.catatan,
        createdById: owner?.id,
      },
    });
  }

  // ---- Bookings dengan sisa pelunasan (piutang) ----
  const bookings = [
    { kode: "WE3", day: 9, entitas: "Ryan Sahabat Sport", noHp: "wa.me/082234187572", harga: 1295000, dp: 300000, sisa: 995000 },
    { kode: "WD3", day: 12, entitas: "Faisal Kita-kita Aja", noHp: "wa.me/085348991518", harga: 1481000, dp: 0, sisa: 1481000 },
    { kode: "WD1", day: 13, entitas: "IMIPAS", noHp: "wa.me/089665548962", harga: 4787200, dp: 0, sisa: 4787200 },
    { kode: "WD1", day: 16, entitas: "Shandy JCI SMR", noHp: "wa.me/085349999091", harga: 2805000, dp: 450000, sisa: 2355000 },
    { kode: "WE3", day: 17, entitas: "Faisal RSP", noHp: "wa.me/081649476726", harga: 1415000, dp: 0, sisa: 1415000 },
    { kode: "WD3", day: 18, entitas: "MR JNT 06", harga: 6281000, dp: 1750000, sisa: 4531000 },
  ];
  for (const b of bookings) {
    await prisma.booking.create({
      data: {
        kode: b.kode,
        tanggalMain: d(b.day),
        namaEntitas: b.entitas,
        noHp: b.noHp,
        harga: b.harga,
        dp: b.dp,
        sisaPelunasan: b.sisa,
        status: b.dp > 0 ? "dp" : "booked",
        accountId: acc("BCA"),
      },
    });
  }

  // ---- Bills / Tagihan rutin (pending, Agustus) ----
  const bills = [
    { nama: "Gaji Karyawan Agustus", kategori: "Gaji Karyawan", nominal: 33901774, day: 28 },
    { nama: "PT. LA JALI Cleaning Service", kategori: "PT. LA JALI (Cleaning)", nominal: 4800000, day: 5 },
    { nama: "Listrik PLN Agustus", kategori: "Listrik", nominal: 15621298, day: 20 },
    { nama: "WiFi Agustus", kategori: "WiFi", nominal: 1115550, day: 10 },
    { nama: "Telkomsel Agustus", kategori: "Telkomsel", nominal: 137532, day: 10 },
    { nama: "Air PDAM Agustus", kategori: "Air", nominal: 500000, day: 15 },
    { nama: "Pajak Daerah 10% Juli", kategori: "Pajak", nominal: 438270, day: 15 },
  ];
  for (const b of bills) {
    await prisma.bill.create({
      data: {
        nama: b.nama,
        categoryId: cat(b.kategori, "expense"),
        nominalEstimasi: b.nominal,
        siklus: "bulanan",
        jatuhTempo: d(b.day),
        status: "pending",
        accountId: acc("BCA"),
      },
    });
  }

  // ---- Budget per kategori (periode Agustus 2026) ----
  const budgetRows = [
    { kategori: "Gaji Karyawan", nominal: 34000000 },
    { kategori: "Listrik", nominal: 16000000 },
    { kategori: "PT. LA JALI (Cleaning)", nominal: 4800000 },
    { kategori: "WiFi", nominal: 1200000 },
    { kategori: "Telkomsel", nominal: 150000 },
    { kategori: "Maintenance", nominal: 1000000 },
    { kategori: "Stock Bola", nominal: 1000000 },
    { kategori: "Alat Kebersihan", nominal: 700000 },
    { kategori: "Marketing", nominal: 500000 },
    { kategori: "Other Expenses - 1", nominal: 2500000 },
    { kategori: "Other Expenses - 2", nominal: 2000000 },
  ];
  await prisma.budget.createMany({
    data: budgetRows.map((b) => ({
      categoryId: cat(b.kategori, "expense"),
      periode: "2026-08",
      nominal: b.nominal,
    })),
  });

  // ---- Settings ----
  await prisma.setting.createMany({
    data: [
      { key: "app_name", value: "V3BKS FinanceFlow" },
      { key: "pph_final_persen", value: "0.5" },
      { key: "pajak_daerah_persen", value: "10" },
      { key: "target_harian_default", value: String(TARGET_HARIAN) },
      { key: "periode_aktif", value: "2026-08" },
      { key: "currency", value: "IDR" },
    ],
  });

  const [txCount, bookCount, billCount] = await Promise.all([
    prisma.transaction.count(),
    prisma.booking.count(),
    prisma.bill.count(),
  ]);
  console.log(`✅ Seed selesai: ${txCount} transaksi, ${bookCount} booking piutang, ${billCount} tagihan.`);
  console.log(`   Login owner: ${ownerEmail} / ${ownerPass}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
