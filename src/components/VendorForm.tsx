"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VendorForm() {
  const router = useRouter();
  const [f, setF] = useState({ tipe: "vendor", nama: "", noHp: "", npwp: "", termin: "", email: "", alamat: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      setF({ tipe: "vendor", nama: "", noHp: "", npwp: "", termin: "", email: "", alamat: "" });
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <p className="card-title">Tambah Kontak</p>
      {msg && <p className="text-xs text-brand-red">{msg}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Tipe</label>
          <select className="input" value={f.tipe} onChange={(e) => set("tipe", e.target.value)}>
            <option value="vendor">Vendor / Supplier</option>
            <option value="pelanggan">Pelanggan</option>
            <option value="keduanya">Keduanya</option>
          </select>
        </div>
        <div>
          <label className="label">Nama</label>
          <input className="input" value={f.nama} onChange={(e) => set("nama", e.target.value)} required />
        </div>
        <div>
          <label className="label">No. HP</label>
          <input className="input" value={f.noHp} onChange={(e) => set("noHp", e.target.value)} placeholder="0812... / wa.me/..." />
        </div>
        <div>
          <label className="label">NPWP</label>
          <input className="input" value={f.npwp} onChange={(e) => set("npwp", e.target.value)} placeholder="opsional (PPh 23 2%)" />
        </div>
        <div>
          <label className="label">Termin (hari)</label>
          <input type="number" min="0" className="input" value={f.termin} onChange={(e) => set("termin", e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" value={f.email} onChange={(e) => set("email", e.target.value)} />
        </div>
      </div>
      <button className="btn-primary text-sm" disabled={busy}>{busy ? "Menyimpan..." : "Simpan Kontak"}</button>
    </form>
  );
}
