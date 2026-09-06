"use client";

import { useRouter } from "next/navigation";

const STATUSES = ["booked", "selesai", "batal"];

export default function BookingRowActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();

  async function setStatus(s: string) {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: s }),
    });
    const result=await res.json();
    if(!res.ok){alert(result.error||"Gagal menyimpan");return;}
    router.refresh();
  }
  async function del() {
    if (!confirm("Hapus booking ini?")) return;
    const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    const result=await res.json();
    if(!res.ok){alert(result.error||"Gagal menyimpan");return;}
    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <select defaultValue={status} onChange={(e) => setStatus(e.target.value)}
        className="input py-1 w-24 text-xs">
        {![...STATUSES].includes(status) && <option value={status} disabled>{status}</option>}
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button onClick={del} className="text-slate-500 hover:text-brand-red text-xs">Hapus</button>
    </div>
  );
}
