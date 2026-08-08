"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RateCard = { id: string; kode: string; nama: string; harga: number };
type Account = { id: string; nama: string };

export default function BookingForm({ rateCards, accounts }: { rateCards: RateCard[]; accounts: Account[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({
    kode: "", tanggalMain: today, jamMulai: "", jamSelesai: "", namaEntitas: "",
    noHp: "", harga: "", dp: "", accountId: accounts[0]?.id ?? "", catatan: "",
  });

  function set(k: string, v: string) { setF((s) => ({ ...s, [k]: v })); }
  function onKode(kode: string) {
    const rc = rateCards.find((r) => r.kode === kode);
    setF((s) => ({ ...s, kode, harga: rc ? String(rc.harga) : s.harga }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setSaving(true);
    const res = await fetch("/api/bookings", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setErr(data.error || "Gagal"); return; }
    setF({ ...f, kode: "", namaEntitas: "", noHp: "", harga: "", dp: "", catatan: "", jamMulai: "", jamSelesai: "" });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return <button onClick={() => setOpen(true)} className="btn-primary text-xs">+ Tambah Booking</button>;
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <div className="flex items-center justify-between">
        <p className="card-title">Booking Baru</p>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-500 text-lg">×</button>
      </div>
      {err && <div className="rounded-lg bg-brand-red/10 border border-brand-red/30 text-brand-red text-sm px-3 py-2">{err}</div>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <label className="label">Kode</label>
          <select className="input" value={f.kode} onChange={(e) => onKode(e.target.value)} required>
            <option value="">—</option>
            {rateCards.map((r) => <option key={r.id} value={r.kode}>{r.kode}</option>)}
          </select>
        </div>
        <div><label className="label">Tanggal Main</label><input type="date" className="input" value={f.tanggalMain} onChange={(e) => set("tanggalMain", e.target.value)} required /></div>
        <div><label className="label">Jam Mulai</label><input className="input" placeholder="18:00" value={f.jamMulai} onChange={(e) => set("jamMulai", e.target.value)} /></div>
        <div><label className="label">Jam Selesai</label><input className="input" placeholder="20:00" value={f.jamSelesai} onChange={(e) => set("jamSelesai", e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="label">Penyewa</label><input className="input" value={f.namaEntitas} onChange={(e) => set("namaEntitas", e.target.value)} required /></div>
        <div><label className="label">No. HP</label><input className="input" placeholder="wa.me/08..." value={f.noHp} onChange={(e) => set("noHp", e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div><label className="label">Harga</label><input type="number" className="input" value={f.harga} onChange={(e) => set("harga", e.target.value)} /></div>
        <div><label className="label">DP</label><input type="number" className="input" value={f.dp} onChange={(e) => set("dp", e.target.value)} /></div>
        <div>
          <label className="label">Rekening</label>
          <select className="input" value={f.accountId} onChange={(e) => set("accountId", e.target.value)}>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
          </select>
        </div>
      </div>
      <button className="btn-primary w-full text-sm" disabled={saving}>{saving ? "Menyimpan..." : "Simpan Booking"}</button>
    </form>
  );
}
