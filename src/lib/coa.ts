// -----------------------------------------------------------------------------
// F-01 · Chart of Accounts (SAK EMKM) — data master + pemetaan
// -----------------------------------------------------------------------------
// Sumber: PRD v2.0 Lampiran 11. Akun "header" (postable=false) hanya untuk
// pengelompokan laporan; jurnal hanya boleh menunjuk akun postable (leaf).

export type CoaTipe = "ASET" | "KEWAJIBAN" | "EKUITAS" | "PENDAPATAN" | "BEBAN" | "HPP";
export type SaldoNormal = "debit" | "kredit";

export type CoaSeed = {
  kode: string;
  nama: string;
  tipe: CoaTipe;
  saldoNormal: SaldoNormal;
  subTipe?: string;
  parent?: string;
  postable?: boolean; // default true; header = false
};

const H = (kode: string, nama: string, tipe: CoaTipe, saldoNormal: SaldoNormal, parent?: string): CoaSeed => ({
  kode, nama, tipe, saldoNormal, parent, postable: false,
});

export const COA: CoaSeed[] = [
  // 1 ASET ---------------------------------------------------------------------
  H("1", "ASET", "ASET", "debit"),
  H("1-1000", "Aset Lancar", "ASET", "debit", "1"),
  { kode: "1-1100", nama: "Kas", tipe: "ASET", saldoNormal: "debit", subTipe: "KAS_BANK", parent: "1-1000" },
  { kode: "1-1110", nama: "Kas Kecil V3BKS", tipe: "ASET", saldoNormal: "debit", subTipe: "KAS_BANK", parent: "1-1000" },
  { kode: "1-1120", nama: "Kas Kecil HSC", tipe: "ASET", saldoNormal: "debit", subTipe: "KAS_BANK", parent: "1-1000" },
  { kode: "1-1200", nama: "Bank BCA", tipe: "ASET", saldoNormal: "debit", subTipe: "KAS_BANK", parent: "1-1000" },
  { kode: "1-1210", nama: "Bank Mandiri", tipe: "ASET", saldoNormal: "debit", subTipe: "KAS_BANK", parent: "1-1000" },
  { kode: "1-1220", nama: "Bank BNI", tipe: "ASET", saldoNormal: "debit", subTipe: "KAS_BANK", parent: "1-1000" },
  { kode: "1-1300", nama: "Piutang Usaha", tipe: "ASET", saldoNormal: "debit", subTipe: "PIUTANG", parent: "1-1000" },
  { kode: "1-1400", nama: "Persediaan Bahan Baku", tipe: "ASET", saldoNormal: "debit", subTipe: "PERSEDIAAN", parent: "1-1000" },
  { kode: "1-1500", nama: "Biaya Dibayar Dimuka", tipe: "ASET", saldoNormal: "debit", parent: "1-1000" },
  H("1-2000", "Aset Tetap", "ASET", "debit", "1"),
  { kode: "1-2100", nama: "Bangunan & Prasarana", tipe: "ASET", saldoNormal: "debit", subTipe: "ASET_TETAP", parent: "1-2000" },
  { kode: "1-2200", nama: "Peralatan Lapangan", tipe: "ASET", saldoNormal: "debit", subTipe: "ASET_TETAP", parent: "1-2000" },
  { kode: "1-2300", nama: "Peralatan Cafe", tipe: "ASET", saldoNormal: "debit", subTipe: "ASET_TETAP", parent: "1-2000" },
  { kode: "1-2900", nama: "Akumulasi Penyusutan", tipe: "ASET", saldoNormal: "kredit", subTipe: "ASET_TETAP", parent: "1-2000" },

  // 2 KEWAJIBAN ----------------------------------------------------------------
  H("2", "KEWAJIBAN", "KEWAJIBAN", "kredit"),
  { kode: "2-1100", nama: "Utang Usaha", tipe: "KEWAJIBAN", saldoNormal: "kredit", subTipe: "UTANG_USAHA", parent: "2" },
  { kode: "2-1200", nama: "Utang Gaji", tipe: "KEWAJIBAN", saldoNormal: "kredit", parent: "2" },
  { kode: "2-1300", nama: "Utang Pajak — PPh Final", tipe: "KEWAJIBAN", saldoNormal: "kredit", subTipe: "UTANG_PAJAK", parent: "2" },
  { kode: "2-1310", nama: "Utang Pajak — PB1 / Pajak Daerah", tipe: "KEWAJIBAN", saldoNormal: "kredit", subTipe: "UTANG_PAJAK", parent: "2" },
  { kode: "2-1320", nama: "Utang Pajak — PPh 21", tipe: "KEWAJIBAN", saldoNormal: "kredit", subTipe: "UTANG_PAJAK", parent: "2" },
  { kode: "2-1330", nama: "Utang Pajak — PPh 23", tipe: "KEWAJIBAN", saldoNormal: "kredit", subTipe: "UTANG_PAJAK", parent: "2" },
  { kode: "2-1400", nama: "Pendapatan Diterima Dimuka", tipe: "KEWAJIBAN", saldoNormal: "kredit", parent: "2" },

  // 3 EKUITAS ------------------------------------------------------------------
  H("3", "EKUITAS", "EKUITAS", "kredit"),
  { kode: "3-1000", nama: "Modal Pemilik", tipe: "EKUITAS", saldoNormal: "kredit", parent: "3" },
  { kode: "3-2000", nama: "Laba Ditahan", tipe: "EKUITAS", saldoNormal: "kredit", parent: "3" },
  { kode: "3-3000", nama: "Prive", tipe: "EKUITAS", saldoNormal: "debit", parent: "3" },

  // 4 PENDAPATAN ---------------------------------------------------------------
  H("4", "PENDAPATAN", "PENDAPATAN", "kredit"),
  { kode: "4-1000", nama: "Pendapatan Rental Lapangan", tipe: "PENDAPATAN", saldoNormal: "kredit", parent: "4" },
  { kode: "4-1100", nama: "Pendapatan Membership", tipe: "PENDAPATAN", saldoNormal: "kredit", parent: "4" },
  { kode: "4-1200", nama: "Pendapatan Jasa (Wasit/Fotografer/Video)", tipe: "PENDAPATAN", saldoNormal: "kredit", parent: "4" },
  { kode: "4-1300", nama: "Pendapatan Sewa Rompi", tipe: "PENDAPATAN", saldoNormal: "kredit", parent: "4" },
  { kode: "4-1400", nama: "Pendapatan Cafe & Resto", tipe: "PENDAPATAN", saldoNormal: "kredit", parent: "4" },
  { kode: "4-1500", nama: "Pendapatan Kelas (Hyrox/Barre/S&C)", tipe: "PENDAPATAN", saldoNormal: "kredit", parent: "4" },
  { kode: "4-1600", nama: "Pendapatan Event & Turnamen", tipe: "PENDAPATAN", saldoNormal: "kredit", parent: "4" },
  { kode: "4-1900", nama: "Pendapatan Lain-lain", tipe: "PENDAPATAN", saldoNormal: "kredit", parent: "4" },

  // 5 HARGA POKOK PENJUALAN ----------------------------------------------------
  H("5", "HARGA POKOK PENJUALAN", "HPP", "debit"),
  { kode: "5-1000", nama: "HPP Cafe — Bahan Baku", tipe: "HPP", saldoNormal: "debit", parent: "5" },
  { kode: "5-1100", nama: "Fee Fotografer & Wasit", tipe: "HPP", saldoNormal: "debit", parent: "5" },
  { kode: "5-1200", nama: "Fee Bagi Hasil (Samkot 35%)", tipe: "HPP", saldoNormal: "debit", parent: "5" },

  // 6 BEBAN OPERASIONAL --------------------------------------------------------
  H("6", "BEBAN OPERASIONAL", "BEBAN", "debit"),
  { kode: "6-1100", nama: "Beban Gaji & Tunjangan", tipe: "BEBAN", saldoNormal: "debit", parent: "6" },
  { kode: "6-1200", nama: "Beban BPJS", tipe: "BEBAN", saldoNormal: "debit", parent: "6" },
  { kode: "6-1300", nama: "Beban Cleaning Service", tipe: "BEBAN", saldoNormal: "debit", parent: "6" },
  { kode: "6-1400", nama: "Beban Listrik", tipe: "BEBAN", saldoNormal: "debit", parent: "6" },
  { kode: "6-1410", nama: "Beban Air", tipe: "BEBAN", saldoNormal: "debit", parent: "6" },
  { kode: "6-1420", nama: "Beban Internet & Telepon", tipe: "BEBAN", saldoNormal: "debit", parent: "6" },
  { kode: "6-1500", nama: "Beban Pemeliharaan", tipe: "BEBAN", saldoNormal: "debit", parent: "6" },
  { kode: "6-1600", nama: "Beban Perlengkapan", tipe: "BEBAN", saldoNormal: "debit", parent: "6" },
  { kode: "6-1700", nama: "Beban Pemasaran", tipe: "BEBAN", saldoNormal: "debit", parent: "6" },
  { kode: "6-1800", nama: "Beban Penyusutan", tipe: "BEBAN", saldoNormal: "debit", parent: "6" },
  { kode: "6-1900", nama: "Selisih Kas", tipe: "BEBAN", saldoNormal: "debit", parent: "6" },
  { kode: "6-2000", nama: "Beban Administrasi Bank & MDR QRIS", tipe: "BEBAN", saldoNormal: "debit", parent: "6" },
  { kode: "6-9000", nama: "Beban Lain-lain", tipe: "BEBAN", saldoNormal: "debit", parent: "6" },

  // 7 BEBAN PAJAK --------------------------------------------------------------
  H("7", "BEBAN PAJAK", "BEBAN", "debit"),
  { kode: "7-1000", nama: "Beban PPh Final 0,5%", tipe: "BEBAN", saldoNormal: "debit", parent: "7" },
  { kode: "7-1100", nama: "Beban Pajak Daerah / PB1", tipe: "BEBAN", saldoNormal: "debit", parent: "7" },
];

// Akun kunci yang dirujuk mesin jurnal ----------------------------------------
export const COA_FALLBACK_PENDAPATAN = "4-1900";
export const COA_FALLBACK_BEBAN = "6-9000";
export const COA_PIUTANG = "1-1300";
export const COA_PENDAPATAN_DDM = "2-1400"; // Pendapatan Diterima Dimuka
export const COA_SELISIH_KAS = "6-1900";

// Pemetaan nama Rekening (Account.nama) -> kode COA kas/bank -------------------
export const ACCOUNT_COA_MAP: Record<string, string> = {
  Cash: "1-1100",
  BCA: "1-1200",
  Mandiri: "1-1210",
  BNI: "1-1220",
};

// Pemetaan nama Kategori pemasukan -> kode COA pendapatan ----------------------
export const INCOME_CATEGORY_COA_MAP: Record<string, string> = {
  Rental: "4-1000",
  Photographer: "4-1200",
  Wasit: "4-1200",
  Recording: "4-1200",
  "New Member": "4-1100",
  "Sewa Rompi": "4-1300",
  "Fee Samkot 65%": "4-1900",
  "Event/Turnamen/Poundfit": "4-1600",
  "Pendapatan Lain-lain": "4-1900",
  Sponsor: "4-1900",
};

// Pemetaan nama Kategori pengeluaran -> kode COA beban -------------------------
export const EXPENSE_CATEGORY_COA_MAP: Record<string, string> = {
  "Gaji Karyawan": "6-1100",
  "PT. LA JALI (Cleaning)": "6-1300",
  "Fee Photographer": "5-1100",
  Listrik: "6-1400",
  Air: "6-1410",
  Solar: "6-9000",
  "Alat Kebersihan": "6-1600",
  "Stock Bola": "6-1600",
  Maintenance: "6-1500",
  WiFi: "6-1420",
  Telkomsel: "6-1420",
  "Other Expenses - 1": "6-9000",
  "Other Expenses - 2": "6-9000",
  "Football Academy": "6-9000",
  "Fee Academy Samkot 35%": "5-1200",
  Marketing: "6-1700",
  "Event/Turnamen/Poundfit": "6-9000",
  Pajak: "7-1100",
  "Bonus/Insentif/THR": "6-1100",
};

// Tentukan kode COA untuk sebuah Rekening (fallback: 1-1100 Kas).
export function coaForAccount(namaAkun: string): string {
  return ACCOUNT_COA_MAP[namaAkun] ?? "1-1100";
}

// Tentukan kode COA untuk sebuah Kategori berdasarkan tipe (income/expense).
export function coaForCategory(namaKategori: string, tipe: string): string {
  if (tipe === "income") return INCOME_CATEGORY_COA_MAP[namaKategori] ?? COA_FALLBACK_PENDAPATAN;
  return EXPENSE_CATEGORY_COA_MAP[namaKategori] ?? COA_FALLBACK_BEBAN;
}
