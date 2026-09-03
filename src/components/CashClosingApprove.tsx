"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CashClosingApprove({ id, canApprove }: { id: string; canApprove: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (!canApprove) return <span className="text-[11px] text-slate-500">menunggu persetujuan</span>;

  async function approve() {
    setBusy(true);
    try {
      const res = await fetch(`/api/tutup-kas/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return <button onClick={approve} disabled={busy} className="btn-primary text-[11px]">{busy ? "..." : "Setujui"}</button>;
}
