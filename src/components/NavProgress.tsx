"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Progress bar tipis di atas layar saat berpindah halaman — memberi umpan balik
// "sedang memuat" sehingga navigasi terasa responsif. Tanpa dependensi eksternal:
// mulai saat klik <a> internal, selesai saat rute (path/query) berubah.
export default function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);

  function start() {
    if (trickle.current) return; // sudah berjalan
    if (hide.current) { clearTimeout(hide.current); hide.current = null; }
    setVisible(true);
    setWidth(8);
    trickle.current = setInterval(() => {
      setWidth((w) => (w < 90 ? w + (90 - w) * 0.15 : w));
    }, 200);
  }

  function finish() {
    if (trickle.current) { clearInterval(trickle.current); trickle.current = null; }
    setWidth(100);
    hide.current = setTimeout(() => { setVisible(false); setWidth(0); }, 250);
  }

  // Mulai bar ketika link internal diklik (fase capture agar sebelum navigasi).
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || a.target === "_blank" || a.hasAttribute("download")) return;
      try {
        const url = new URL(a.href, location.href);
        if (url.origin !== location.origin) return;
        if (url.pathname + url.search === location.pathname + location.search) return;
        start();
      } catch {
        /* href tidak valid — abaikan */
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Selesaikan bar saat rute berubah (path atau query).
  useEffect(() => {
    finish();
    return () => { if (hide.current) clearTimeout(hide.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  if (!visible) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 pointer-events-none">
      <div
        className="h-full bg-brand-green transition-[width] duration-200 ease-out shadow-[0_0_8px_rgba(34,197,94,0.7)]"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
