"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountingRepairClient({ count }: { count: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function repair() {
    if (!window.confirm(`Bentuk jurnal untuk ${count} transaksi aktif yang belum berjurnal? Proses ini idempoten dan tidak mengubah nominal transaksi.`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/accounting/backfill", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbaiki jurnal");
      setMessage(`${data.posted} jurnal berhasil dibentuk. Debit dan kredit seimbang.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memperbaiki jurnal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-brand-amber/30 bg-brand-amber/10 p-3">
      <p className="text-xs text-brand-amber">Laporan Neraca belum lengkap karena {count} transaksi aktif belum memiliki jurnal.</p>
      <button onClick={repair} disabled={busy} className="btn-primary text-xs mt-2">
        {busy ? "Memperbaiki..." : `Bentuk ${count} Jurnal yang Hilang`}
      </button>
      {message && <p className="text-xs text-slate-300 mt-2">{message}</p>}
    </div>
  );
}
