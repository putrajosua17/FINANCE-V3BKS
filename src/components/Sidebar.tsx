"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navForRole } from "@/components/navItems";

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-white/[0.06] bg-[#090e0c]/85 backdrop-blur-2xl h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Link href="/dashboard" className="group block">
          <div className="flex items-center gap-3">
            <div className="relative grid h-10 w-10 place-items-center rounded-xl border border-brand-green/25 bg-brand-green/10 shadow-lg shadow-brand-green/5">
              <span className="text-sm font-black tracking-tight text-brand-green">V3</span>
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#090e0c] bg-[#d9ff55]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[15px] font-bold tracking-tight text-white">V3BKS</span>
                <span className="text-[11px] font-semibold text-brand-green">OS</span>
              </div>
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-slate-500">Finance · Operations</p>
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        {navForRole(role).map((g) => (
          <div key={g.title}>
            <p className="px-3 text-[9px] font-semibold text-slate-600 uppercase tracking-[0.2em] mb-2.5">
              {g.title}
            </p>
            <ul className="space-y-1">
              {g.items.map((it) => {
                const active = pathname === it.href || pathname.startsWith(it.href + "/");
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition duration-200 ${
                        active
                          ? "border border-brand-green/15 bg-brand-green/[0.08] text-brand-green shadow-[inset_0_1px_0_rgba(255,255,255,.025)]"
                          : "border border-transparent text-slate-400 hover:border-white/[0.05] hover:text-slate-100 hover:bg-white/[0.025]"
                      }`}
                    >
                      {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand-green shadow-[0_0_14px_rgba(34,197,94,.8)]" />}
                      <span className={`w-5 text-center text-[13px] transition ${
                        active ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                      }`}>{it.icon}</span>
                      <span className="truncate">{it.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="m-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
        <p className="text-[9px] uppercase tracking-[0.18em] text-slate-600">Workspace</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-slate-300">V3BKS Core</p>
            <p className="mt-0.5 text-[10px] text-slate-600">Finance system active</p>
          </div>
          <span className="h-2 w-2 shrink-0 rounded-full bg-brand-green shadow-[0_0_10px_rgba(34,197,94,.65)]" />
        </div>
      </div>
    </aside>
  );
}
