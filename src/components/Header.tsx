"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import MobileNav from "@/components/MobileNav";

const TITLES: Record<string, string> = {
  "/lapangan": "Lapangan",
  "/tutup-kas": "Tutup Kas",
  "/operasional": "Bukti & Koreksi",
  "/pembayaran": "DP & Pelunasan",
  "/dashboard": "Command Center",
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

export default function Header({ userName, role, showPeriod = false }: { userName: string; role: string; showPeriod?: boolean }) {
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
    <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#070b0a]/75 px-3 py-3 backdrop-blur-2xl sm:px-5 lg:px-6">
      <div className="mx-auto flex w-full max-w-[1680px] flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <MobileNav role={role} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-semibold tracking-tight text-white sm:text-lg">{title}</h1>
              {pathname === "/dashboard" && (
                <span className="hidden rounded-full border border-brand-green/20 bg-brand-green/[0.07] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-brand-green sm:inline-flex">
                  Live
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-600">V3BKS Mini Soccer · Management Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showPeriod && role !== "admin" && (
            <div className="hidden lg:flex items-center rounded-xl border border-white/[0.06] bg-white/[0.025] p-1 text-xs">
              <button
                onClick={() => setPeriode("lalu")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  periode === "lalu" ? "bg-white/[0.07] text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Bulan Lalu
              </button>
              <button
                onClick={() => setPeriode("ini")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  periode === "ini" ? "bg-brand-green text-black font-semibold shadow-lg shadow-brand-green/10" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Bulan Ini
              </button>
            </div>
          )}

          <div className="flex shrink-0 items-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
            <div className="hidden h-8 w-8 items-center justify-center rounded-lg border border-brand-green/20 bg-brand-green/[0.09] text-xs font-bold text-brand-green sm:flex">
              {userName.charAt(0).toUpperCase()}
            </div>
            <button onClick={logout} className="min-h-9 px-3 text-xs text-slate-500 transition hover:text-brand-red">
              Keluar
            </button>
          </div>
        </div>

        {showPeriod && role !== "admin" && (
          <label className="flex w-full items-center gap-3 border-t border-white/[0.05] pt-3 text-xs text-slate-500 lg:hidden">
            Periode laporan
            <select aria-label="Periode laporan" className="input flex-1" value={periode} onChange={e=>setPeriode(e.target.value as "ini" | "lalu")}>
              <option value="lalu">Bulan Lalu</option>
              <option value="ini">Bulan Ini</option>
            </select>
          </label>
        )}
      </div>
    </header>
  );
}
