"use client";

import { useRouter } from "next/navigation";

const STATUSES = ["booked", "dp", "lunas", "selesai", "batal"];

export default function BookingRowActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();

  async function setStatus(s: string) {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: s }),
    });
    router.refresh();
  }
  async function del() {
    if (!confirm("Hapus booking ini?")) return;
    await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <select defaultValue={status} onChange={(e) => setStatus(e.target.value)}
        className="input py-1 w-24 text-xs">
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button onClick={del} className="text-slate-500 hover:text-brand-red text-xs">Hapus</button>
    </div>
  );
}
