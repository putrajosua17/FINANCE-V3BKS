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
        className="w-11 h-11 shrink-0 rounded-lg bg-ink-800 text-slate-200 flex items-center justify-center"
      >
        <span className="text-lg">☰</span>
      </button>

      <dialog ref={dialog} aria-label="Menu utama" onClose={()=>setOpen(false)} onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}} className="mobile-menu">

          <div className="h-full w-64 max-w-[85vw] bg-ink-900 border-r border-white/10 overflow-y-auto">
            <div className="px-5 py-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-white">Finance</span>
                <span className="text-base font-bold text-brand-green">Flow</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 text-xl w-11 h-11 shrink-0" aria-label="Tutup">×</button>
            </div>
            <nav className="py-4 px-3 space-y-5">
              {navForRole(role).map((g) => (
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
                            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm ${
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
      </dialog>
    </div>
  );
}
