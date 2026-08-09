"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Vendor = { id: string; nama: string; termin: number; npwp: string | null };
type Coa = { kode: string; nama: string };
type BusinessUnit = { id: string; nama: string; induk: string };

export default function PurchaseInvoiceForm({ vendors, bebanAkun, businessUnits }: { vendors: Vendor[]; bebanAkun: Coa[]; businessUnits: BusinessUnit[] }) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({
    vendorId: vendors[0]?.id ?? "",
    tanggal: today,
    jatuhTempo: today,
    keterangan: "",
    coaBebanKode: bebanAkun[0]?.kode ?? "",
    subtotal: "",
    ppn: "",
    pphDipotong: "",
    businessUnitId: businessUnits[0]?.id ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const subtotal = Number(f.subtotal) || 0;
  const ppn = Number(f.ppn) || 0;
  const pph = Number(f.pphDipotong) || 0;
  const total = subtotal + ppn - pph;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/purchase-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      setMsg({ type: "ok", text: `Faktur ${data.nomor} tersimpan ✓` });
      setF((s) => ({ ...s, keterangan: "", subtotal: "", ppn: "", pphDipotong: "" }));
      router.refresh();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Gagal" });
    } finally {
      setBusy(false);
    }
  }

  if (vendors.length === 0) {
    return <div className="card text-sm text-slate-400">Tambahkan vendor dulu di menu <span className="text-slate-200">Kontak</span> sebelum membuat faktur pembelian.</div>;
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <p className="card-title">Faktur Pembelian Baru (Utang)</p>
      {msg && <div className={`rounded-lg text-sm px-3 py-2 border ${msg.type === "ok" ? "bg-brand-green/10 border-brand-green/30 text-brand-green" : "bg-brand-red/10 border-brand-red/30 text-brand-red"}`}>{msg.text}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Vendor</label>
          <select className="input" value={f.vendorId} onChange={(e) => set("vendorId", e.target.value)} required>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.nama}{v.npwp ? "" : " (non-NPWP)"}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Tanggal</label>
          <input type="date" className="input" value={f.tanggal} onChange={(e) => set("tanggal", e.target.value)} required />
        </div>
        <div>
          <label className="label">Jatuh Tempo</label>
          <input type="date" className="input" value={f.jatuhTempo} onChange={(e) => set("jatuhTempo", e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Keterangan</label>
          <input className="input" value={f.keterangan} onChange={(e) => set("keterangan", e.target.value)} placeholder="mis. Stok bola, bahan cafe" />
        </div>
        <div>
          <label className="label">Akun Beban/Persediaan</label>
          <select className="input" value={f.coaBebanKode} onChange={(e) => set("coaBebanKode", e.target.value)}>
            {bebanAkun.map((c) => <option key={c.kode} value={c.kode}>{c.kode} · {c.nama}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="label">Subtotal</label>
          <input type="number" className="input" value={f.subtotal} onChange={(e) => set("subtotal", e.target.value)} required />
        </div>
        <div>
          <label className="label">PPN</label>
          <input type="number" className="input" value={f.ppn} onChange={(e) => set("ppn", e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="label">PPh 23 Dipotong</label>
          <input type="number" className="input" value={f.pphDipotong} onChange={(e) => set("pphDipotong", e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="label">Total Utang</label>
          <div className="input bg-ink-800 tabular-nums">{total.toLocaleString("id-ID")}</div>
        </div>
      </div>
      {businessUnits.length > 0 && (
        <div className="max-w-xs">
          <label className="label">Unit</label>
          <select className="input" value={f.businessUnitId} onChange={(e) => set("businessUnitId", e.target.value)}>
            {businessUnits.map((u) => <option key={u.id} value={u.id}>{u.nama}</option>)}
          </select>
        </div>
      )}
      <button className="btn-primary text-sm" disabled={busy}>{busy ? "Menyimpan..." : "Simpan Faktur (posting utang)"}</button>
    </form>
  );
}
