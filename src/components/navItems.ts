export type NavItem = { href: string; label: string; icon: string };
export type NavGroup = { title: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Menu Utama",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "▦" },
      { href: "/transaksi/tambah", label: "Tambah Transaksi", icon: "＋" },
      { href: "/transaksi/riwayat", label: "Riwayat Transaksi", icon: "🧾" },
      { href: "/transaksi/impor", label: "Impor Data", icon: "📥" },
    ],
  },
  {
    title: "Modul",
    items: [
      { href: "/rekening", label: "Daftar Rekening", icon: "🏦" },
      { href: "/target-tagihan", label: "Target & Tagihan", icon: "🎯" },
      { href: "/booking", label: "Booking & Jadwal", icon: "📅" },
      { href: "/laporan", label: "Laporan Keuangan", icon: "📈" },
      { href: "/budgeting", label: "Budgeting & Prediksi", icon: "🧮" },
    ],
  },
  {
    title: "Akuntansi",
    items: [
      { href: "/laporan/neraca", label: "Neraca", icon: "⚖️" },
      { href: "/laporan/neraca-saldo", label: "Neraca Saldo", icon: "🧾" },
      { href: "/laporan/buku-besar", label: "Buku Besar", icon: "📚" },
      { href: "/laporan/per-unit", label: "Laba Rugi per Unit", icon: "🏢" },
      { href: "/tutup-buku", label: "Tutup Buku", icon: "🔒" },
    ],
  },
  {
    title: "Bantuan",
    items: [
      { href: "/flowai", label: "FlowAI Insight", icon: "🤖" },
      { href: "/audit", label: "Log Aktivitas", icon: "🕓" },
      { href: "/panduan", label: "Panduan", icon: "📖" },
      { href: "/pengaturan", label: "Pengaturan", icon: "⚙️" },
    ],
  },
];
