"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "@/components/navItems";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Buka menu"
        className="w-9 h-9 rounded-lg bg-ink-800 text-slate-200 flex items-center justify-center"
      >
        <span className="text-lg">☰</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-ink-900 border-r border-white/10 overflow-y-auto">
            <div className="px-5 py-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-white">Finance</span>
                <span className="text-base font-bold text-brand-green">Flow</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 text-xl" aria-label="Tutup">×</button>
            </div>
            <nav className="py-4 px-3 space-y-5">
              {NAV_GROUPS.map((g) => (
                <div key={g.title}>
                  <p className="px-3 text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">{g.title}</p>
                  <ul className="space-y-0.5">
                    {g.items.map((it) => {
                      const active = pathname === it.href || pathname.startsWith(it.href + "/");
                      return (
                        <li key={it.href}>
                          <Link
                            href={it.href}
                            onClick={() => setOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                              active ? "bg-brand-green/10 text-brand-green font-medium" : "text-slate-400 hover:bg-ink-800"
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
          </div>
        </div>
      )}
    </div>
  );
}
