import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Inisialisasi master data + owner — idempotent & non-destruktif.
 * Aman dipanggil berkali-kali; tidak menimpa password owner yang sudah ada.
 * Tidak menerima input dari pengguna (hanya baca env server).
 */
export async function runSetup() {
  const ownerEmail = (process.env.SEED_OWNER_EMAIL || "owner@v3bks.id").toLowerCase();
  const ownerPass = process.env.SEED_OWNER_PASSWORD || "owner123";

  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: { nama: "Owner V3BKS", email: ownerEmail, passwordHash: await bcrypt.hash(ownerPass, 10), role: "owner" },
  });

  await prisma.account.createMany({
    data: [
      { nama: "Cash", tipe: "cash", urutan: 1 },
      { nama: "BCA", tipe: "bank", urutan: 2 },
      { nama: "Mandiri", tipe: "bank", urutan: 3 },
      { nama: "BNI", tipe: "bank", urutan: 4 },
    ],
    skipDuplicates: true,
  });

  const incomeCats = ["Rental", "Photographer", "Wasit", "Recording", "New Member", "Sewa Rompi", "Fee Samkot 65%", "Event/Turnamen/Poundfit", "Pendapatan Lain-lain", "Sponsor"];
  const expenseCats: [string, boolean][] = [
    ["Gaji Karyawan", true], ["PT. LA JALI (Cleaning)", true], ["Fee Photographer", false], ["Listrik", true], ["Air", true],
    ["Solar", false], ["Alat Kebersihan", false], ["Stock Bola", false], ["Maintenance", false], ["WiFi", true], ["Telkomsel", true],
    ["Other Expenses - 1", false], ["Other Expenses - 2", false], ["Football Academy", false], ["Fee Academy Samkot 35%", false],
    ["Marketing", false], ["Event/Turnamen/Poundfit", false], ["Pajak", true], ["Bonus/Insentif/THR", false],
  ];
  await prisma.category.createMany({
    data: [
      ...incomeCats.map((nama, i) => ({ nama, tipe: "income", urutan: i + 1 })),
      ...expenseCats.map(([nama, rec], i) => ({ nama, tipe: "expense", isRecurring: rec, urutan: i + 1 })),
    ],
    skipDuplicates: true,
  });

  await prisma.rateCard.createMany({
    data: [
      { kode: "WD1", nama: "Weekday 07.00-16.00", kelompok: "RENTAL", hari: "weekday", jamMulai: "07:00", jamSelesai: "16:00", durasi: 1, harga: 600000 },
      { kode: "WD2", nama: "Weekday 16.00-18.00", kelompok: "RENTAL", hari: "weekday", jamMulai: "16:00", jamSelesai: "18:00", durasi: 1, harga: 800000 },
      { kode: "WD3", nama: "Weekday 18.00-23.00", kelompok: "RENTAL", hari: "weekday", jamMulai: "18:00", jamSelesai: "23:00", durasi: 1, harga: 960000 },
      { kode: "WE1", nama: "Weekend 07.00-16.00", kelompok: "RENTAL", hari: "weekend", jamMulai: "07:00", jamSelesai: "16:00", durasi: 1, harga: 720000 },
      { kode: "WE2", nama: "Weekend 16.00-18.00", kelompok: "RENTAL", hari: "weekend", jamMulai: "16:00", jamSelesai: "18:00", durasi: 1, harga: 960000 },
      { kode: "WE3", nama: "Weekend 18.00-23.00", kelompok: "RENTAL", hari: "weekend", jamMulai: "18:00", jamSelesai: "23:00", durasi: 1, harga: 1040000 },
      { kode: "WASIT1", nama: "Wasit 1 Jam", kelompok: "WASIT", durasi: 1, harga: 200000 },
      { kode: "WASIT2", nama: "Wasit 2 Jam", kelompok: "WASIT", durasi: 2, harga: 350000 },
      { kode: "WASIT3", nama: "Wasit 3 Jam", kelompok: "WASIT", durasi: 3, harga: 450000 },
      { kode: "WASIT4", nama: "Wasit 4 Jam", kelompok: "WASIT", durasi: 4, harga: 650000 },
      { kode: "PG1", nama: "Photographer 1 Jam", kelompok: "PHOTOGRAPHER", durasi: 1, harga: 300000 },
      { kode: "PG2", nama: "Photographer 2 Jam", kelompok: "PHOTOGRAPHER", durasi: 2, harga: 500000 },
      { kode: "PG3", nama: "Photographer 3 Jam", kelompok: "PHOTOGRAPHER", durasi: 3, harga: 600000 },
      { kode: "PG4", nama: "Photographer 4 Jam", kelompok: "PHOTOGRAPHER", durasi: 4, harga: 750000 },
      { kode: "ROMPI1", nama: "Sewa Rompi 1 Set", kelompok: "ROMPI", durasi: 1, harga: 70000 },
      { kode: "ROMPI2", nama: "Sewa Rompi 2 Set", kelompok: "ROMPI", durasi: 2, harga: 100000 },
      { kode: "VD1", nama: "Video 1 Jam", kelompok: "VIDEO", durasi: 1, harga: 150000 },
      { kode: "VD2", nama: "Video 2 Jam", kelompok: "VIDEO", durasi: 2, harga: 300000 },
      { kode: "VD3", nama: "Video 3 Jam", kelompok: "VIDEO", durasi: 3, harga: 450000 },
      { kode: "MEMBER-WD", nama: "Member Weekday (Senin-Jumat)", kelompok: "MEMBER", hari: "weekday", harga: 3000000 },
      { kode: "MEMBER-WE", nama: "Member Weekend (Sabtu-Minggu)", kelompok: "MEMBER", hari: "weekend", harga: 3500000 },
    ],
    skipDuplicates: true,
  });

  // Target (harian sebulan + bulanan) untuk periode aktif
  const now = new Date();
  const tahun = now.getFullYear();
  const bulan = now.getMonth();
  const hariDalamBulan = new Date(tahun, bulan + 1, 0).getDate();
  const targetRows: { periode: string; tanggal: Date; nilai: number }[] = [];
  for (let day = 1; day <= hariDalamBulan; day++) {
    targetRows.push({ periode: "harian", tanggal: new Date(tahun, bulan, day, 8), nilai: 6000000 });
  }
  targetRows.push({ periode: "bulanan", tanggal: new Date(tahun, bulan, 1, 8), nilai: 186000000 });
  await prisma.target.createMany({ data: targetRows, skipDuplicates: true });

  const settings = [
    { key: "app_name", value: "V3BKS FinanceFlow" },
    { key: "pph_final_persen", value: "0.5" },
    { key: "pajak_daerah_persen", value: "10" },
    { key: "target_harian_default", value: "6000000" },
    { key: "periode_aktif", value: `${tahun}-${String(bulan + 1).padStart(2, "0")}` },
    { key: "currency", value: "IDR" },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s });
  }

  return {
    users: await prisma.user.count(),
    accounts: await prisma.account.count(),
    categories: await prisma.category.count(),
    rateCards: await prisma.rateCard.count(),
    targets: await prisma.target.count(),
    ownerEmail,
  };
}
