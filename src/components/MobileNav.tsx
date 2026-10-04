"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navForRole } from "@/components/navItems";

export default function MobileNav({ role }: { role: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!open) { dialog.current?.close(); return; }
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Buka menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-slate-200"
      >
        <span className="text-lg">☰</span>
      </button>

      <dialog ref={dialog} aria-label="Menu utama" onClose={()=>setOpen(false)} onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}} className="mobile-menu">
        <div className="h-full w-72 max-w-[88vw] overflow-y-auto border-r border-white/[0.07] bg-[#090e0c]/95 backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5">
            <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3">
              <div className="relative grid h-10 w-10 place-items-center rounded-xl border border-brand-green/25 bg-brand-green/10">
                <span className="text-sm font-black text-brand-green">V3</span>
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#090e0c] bg-[#d9ff55]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">V3BKS <span className="text-brand-green">OS</span></p>
                <p className="text-[9px] uppercase tracking-[0.17em] text-slate-600">Finance · Operations</p>
              </div>
            </Link>
            <button onClick={() => setOpen(false)} className="h-11 w-11 shrink-0 text-xl text-slate-500" aria-label="Tutup">×</button>
          </div>

          <nav className="space-y-6 px-3 py-5">
            {navForRole(role).map((g) => (
              <div key={g.title}>
                <p className="mb-2.5 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">{g.title}</p>
                <ul className="space-y-1">
                  {g.items.map((it) => {
                    const active = pathname === it.href || pathname.startsWith(it.href + "/");
                    return (
                      <li key={it.href}>
                        <Link
                          href={it.href}
                          onClick={() => setOpen(false)}
                          className={`relative flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                            active
                              ? "border-brand-green/15 bg-brand-green/[0.08] text-brand-green font-medium"
                              : "border-transparent text-slate-400 hover:border-white/[0.05] hover:bg-white/[0.025]"
                          }`}
                        >
                          {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand-green" />}
                          <span className="w-5 text-center text-[13px]">{it.icon}</span>
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
      </dialog>
    </div>
  );
}
