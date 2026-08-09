"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/format";

type Account = { id: string; nama: string };
type BusinessUnit = { id: string; nama: string; induk: string };

const PECAHAN = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];

export default function TutupKasForm({ accounts, businessUnits }: { accounts: Account[]; businessUnits: BusinessUnit[] }) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [tanggal, setTanggal] = useState(today);
  const [shift, setShift] = useState("harian");
  const [buId, setBuId] = useState(businessUnits[0]?.id ?? "");
  const [saldoSistem, setSaldoSistem] = useState<number | null>(null);
  const [pecahan, setPecahan] = useState<Record<number, string>>({});
  const [catatan, setCatatan] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!accountId) return;
    let active = true;
    fetch(`/api/tutup-kas?accountId=${accountId}&tanggal=${tanggal}`)
      .then((r) => r.json())
      .then((d) => { if (active) setSaldoSistem(typeof d.saldoSistem === "number" ? d.saldoSistem : null); })
      .catch(() => {});
    return () => { active = false; };
  }, [accountId, tanggal]);

  const saldoFisik = PECAHAN.reduce((s, p) => s + p * (Number(pecahan[p]) || 0), 0);
  const selisih = saldoSistem == null ? 0 : Math.round((saldoFisik - saldoSistem) * 100) / 100;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (selisih !== 0 && !catatan) return setMsg({ type: "err", text: "Selisih ≠ 0 — isi catatan penyebab." });
    setBusy(true);
    try {
      const rincianPecahan = Object.fromEntries(PECAHAN.filter((p) => Number(pecahan[p]) > 0).map((p) => [p, Number(pecahan[p])]));
      const res = await fetch("/api/tutup-kas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, tanggal, shift, businessUnitId: buId, saldoFisik, rincianPecahan, catatan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      setMsg({ type: "ok", text: "Tutup kas diajukan ✓" });
      setPecahan({});
      setCatatan("");
      router.refresh();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Gagal" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <p className="card-title">Tutup Kas Shift</p>
      {msg && (
        <div className={`rounded-lg text-sm px-3 py-2 border ${msg.type === "ok" ? "bg-brand-green/10 border-brand-green/30 text-brand-green" : "bg-brand-red/10 border-brand-red/30 text-brand-red"}`}>{msg.text}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="label">Tanggal</label>
          <input type="date" className="input" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required />
        </div>
        <div>
          <label className="label">Shift</label>
          <select className="input" value={shift} onChange={(e) => setShift(e.target.value)}>
            <option value="harian">Harian</option>
            <option value="pagi">Pagi</option>
            <option value="sore">Sore</option>
            <option value="malam">Malam</option>
          </select>
        </div>
        <div>
          <label className="label">Rekening Kas</label>
          <select className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
          </select>
        </div>
        {businessUnits.length > 0 && (
          <div>
            <label className="label">Unit</label>
            <select className="input" value={buId} onChange={(e) => setBuId(e.target.value)}>
              {businessUnits.map((u) => <option key={u.id} value={u.id}>{u.nama}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Rincian pecahan */}
      <div>
        <label className="label">Hitung Uang Fisik (per pecahan)</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PECAHAN.map((p) => (
            <div key={p} className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-16 tabular-nums">{p.toLocaleString("id-ID")}</span>
              <input type="number" min="0" className="input py-1 text-sm" placeholder="0" value={pecahan[p] ?? ""} onChange={(e) => setPecahan((f) => ({ ...f, [p]: e.target.value }))} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg bg-ink-800 p-3">
          <p className="text-xs text-slate-400">Saldo Sistem</p>
          <p className="text-base font-bold text-white tabular-nums">{saldoSistem == null ? "…" : formatRupiah(saldoSistem)}</p>
        </div>
        <div className="rounded-lg bg-ink-800 p-3">
          <p className="text-xs text-slate-400">Saldo Fisik</p>
          <p className="text-base font-bold text-white tabular-nums">{formatRupiah(saldoFisik)}</p>
        </div>
        <div className="rounded-lg bg-ink-800 p-3">
          <p className="text-xs text-slate-400">Selisih</p>
          <p className={`text-base font-bold tabular-nums ${selisih === 0 ? "text-brand-green" : "text-brand-red"}`}>{formatRupiah(selisih)}</p>
        </div>
      </div>

      {selisih !== 0 && (
        <div>
          <label className="label">Catatan penyebab selisih (wajib)</label>
          <textarea className="input min-h-[52px]" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
        </div>
      )}

      <button className="btn-primary text-sm" disabled={busy || saldoSistem == null}>{busy ? "Menyimpan..." : "Ajukan Tutup Kas"}</button>
    </form>
  );
}
