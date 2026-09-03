"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  periode: string;
  status: string; // terbuka | terkunci | final
  role: string;
  canLock: boolean; // checklist lulus
};

export default function TutupBukuClient({ periode, status, role, canLock }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const terkunci = status === "terkunci" || status === "final";

  async function submit(action: "lock" | "unlock") {
    setErr(null);
    let catatan: string | null = null;
    if (action === "unlock") {
      catatan = window.prompt("Alasan membuka kembali periode (wajib):");
      if (!catatan) return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/periode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periode, action, catatan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal memproses");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {err && <p className="text-xs text-brand-red">{err}</p>}
      {!terkunci ? (
        <button
          onClick={() => submit("lock")}
          disabled={busy || !canLock}
          className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          title={canLock ? "" : "Lengkapi checklist terlebih dahulu"}
        >
          🔒 Kunci Periode {periode}
        </button>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-sm text-brand-amber">🔒 Periode {periode} terkunci</span>
          {role === "owner" && (
            <button onClick={() => submit("unlock")} disabled={busy} className="btn-ghost text-xs">
              Buka kembali (owner)
            </button>
          )}
        </div>
      )}
      {!canLock && !terkunci && (
        <p className="text-[11px] text-slate-500">Checklist wajib lulus sebelum periode dapat dikunci.</p>
      )}
    </div>
  );
}
