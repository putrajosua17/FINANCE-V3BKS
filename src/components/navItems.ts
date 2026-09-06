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
    title: "Operasional Harian",
    items: [
      { href: "/rekonsiliasi", label: "Rekonsiliasi Bank", icon: "🔗" },
      { href: "/tutup-kas", label: "Tutup Kas Harian", icon: "💵" },
      { href: "/utang", label: "Utang Usaha (AP)", icon: "📤" },
      { href: "/piutang", label: "Piutang (AR)", icon: "📥" },
      { href: "/vendor", label: "Vendor & Pelanggan", icon: "👥" },
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

export function navForRole(role: string): NavGroup[] {
  if (role === "admin") return [{ title: "Lapangan", items: [
    { href: "/lapangan", label: "Beranda", icon: "⌂" },
    { href: "/transaksi/impor", label: "Tracker & Impor", icon: "↑" },
    { href: "/pembayaran", label: "DP & Pelunasan", icon: "✓" },
    { href: "/operasional", label: "Bukti & Koreksi", icon: "▤" },
    { href: "/tutup-kas", label: "Tutup Kas", icon: "◉" },
  ] }];
  return [{ title: "Pemeriksaan", items: [
    { href: "/lapangan", label: "Operasional Lapangan", icon: "⌂" },
    { href: "/transaksi/impor", label: "Persetujuan Impor", icon: "↑" },
    { href: "/operasional", label: "Bukti & Koreksi", icon: "▤" },
    { href: "/pembayaran", label: "DP & Pelunasan", icon: "✓" },
  ] }, ...NAV_GROUPS.map(g => ({...g, items:g.items.filter(i => !["/flowai", "/laporan/per-unit", "/transaksi/impor"].includes(i.href))}))];
}
