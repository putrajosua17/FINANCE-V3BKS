"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import MobileNav from "@/components/MobileNav";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transaksi/tambah": "Tambah Transaksi",
  "/transaksi/riwayat": "Riwayat Transaksi",
  "/transaksi/impor": "Impor Data",
  "/rekening": "Daftar Rekening",
  "/target-tagihan": "Target & Tagihan",
  "/booking": "Booking & Jadwal",
  "/laporan": "Laporan Keuangan",
  "/budgeting": "Budgeting & Prediksi",
  "/flowai": "FlowAI Insight",
  "/audit": "Log Aktivitas",
  "/panduan": "Panduan",
  "/pengaturan": "Pengaturan",
};

export default function Header({ userName, showPeriod = false }: { userName: string; showPeriod?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const periode = params.get("periode") === "lalu" ? "lalu" : "ini";

  const title =
    Object.entries(TITLES).find(([k]) => pathname === k || pathname.startsWith(k + "/"))?.[1] ?? "V3BKS FinanceFlow";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function setPeriode(p: "ini" | "lalu") {
    const sp = new URLSearchParams(Array.from(params.entries()));
    sp.set("periode", p);
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <header className="sticky top-0 z-20 bg-ink-950/80 backdrop-blur border-b border-white/5 px-5 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <MobileNav />
        <div>
          <h1 className="text-lg font-semibold text-white leading-tight">{title}</h1>
          <p className="text-[11px] text-slate-500">V3BKS Mini Soccer</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {showPeriod && (
          <div className="flex items-center rounded-lg bg-ink-800 p-0.5 text-xs">
            <button
              onClick={() => setPeriode("lalu")}
              className={`px-3 py-1.5 rounded-md ${periode === "lalu" ? "bg-ink-700 text-white" : "text-slate-400"}`}
            >
              Bulan Lalu
            </button>
            <button
              onClick={() => setPeriode("ini")}
              className={`px-3 py-1.5 rounded-md ${periode === "ini" ? "bg-brand-green text-black font-medium" : "text-slate-400"}`}
            >
              Bulan Ini
            </button>
          </div>
        )}
        <Link href="/transaksi/tambah?quick=1" className="btn-primary text-xs">
          + Quick Spend
        </Link>
        <div className="hidden sm:flex items-center gap-2 pl-2">
          <div className="w-8 h-8 rounded-full bg-brand-green/20 text-brand-green flex items-center justify-center text-sm font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <button onClick={logout} className="text-xs text-slate-400 hover:text-brand-red">
            Keluar
          </button>
        </div>
      </div>
    </header>
  );
}
