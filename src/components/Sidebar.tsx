"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: string };
type Group = { title: string; items: Item[] };

const groups: Group[] = [
  {
    title: "Menu Utama",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "▦" },
      { href: "/transaksi/tambah", label: "Tambah Transaksi", icon: "＋" },
      { href: "/transaksi/riwayat", label: "Riwayat Transaksi", icon: "🧾" },
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
    title: "Bantuan",
    items: [
      { href: "/flowai", label: "FlowAI Insight", icon: "🤖" },
      { href: "/panduan", label: "Panduan", icon: "📖" },
      { href: "/pengaturan", label: "Pengaturan", icon: "⚙️" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-60 shrink-0 bg-ink-900 border-r border-white/5 h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="text-base font-bold text-white">Finance</span>
          <span className="text-base font-bold text-brand-green">Flow</span>
          <span className="badge bg-brand-amber/20 text-brand-amber ml-1">PRO</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1 tracking-widest uppercase">Ultimate OS · V1.6</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-3 text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
              {g.title}
            </p>
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const active = pathname === it.href || pathname.startsWith(it.href + "/");
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-brand-green/10 text-brand-green font-medium"
                          : "text-slate-400 hover:text-slate-200 hover:bg-ink-800"
                      }`}
                    >
                      <span className="w-4 text-center text-[13px]">{it.icon}</span>
                      <span>{it.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
