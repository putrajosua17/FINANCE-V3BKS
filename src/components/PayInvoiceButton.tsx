"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Account = { id: string; nama: string };

export default function PayInvoiceButton({ id, sisa, accounts }: { id: string; sisa: number; accounts: Account[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [jumlah, setJumlah] = useState(String(sisa));
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/purchase-invoices/${id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jumlah: Number(jumlah), accountId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return <button className="btn-primary text-[11px]" onClick={() => setOpen(true)}>Bayar</button>;

  return (
    <div className="flex flex-wrap items-end gap-2 justify-end">
      {err && <span className="text-[11px] text-brand-red w-full text-right">{err}</span>}
      <input type="number" className="input py-1 text-xs w-28" value={jumlah} onChange={(e) => setJumlah(e.target.value)} />
      <select className="input py-1 text-xs" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
        {accounts.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
      </select>
      <button className="btn-primary text-[11px]" disabled={busy} onClick={pay}>{busy ? "..." : "OK"}</button>
      <button className="btn-ghost text-[11px]" onClick={() => setOpen(false)}>✕</button>
    </div>
  );
}
