"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Account = { id: string; nama: string };

export default function RekonsiliasiUpload({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [bank, setBank] = useState("generic");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setMsg({ type: "err", text: "Pilih file e-statement (CSV) dulu." });
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.set("accountId", accountId);
      fd.set("bank", bank);
      fd.set("file", file);
      const res = await fetch("/api/rekonsiliasi", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      router.push(`/rekonsiliasi/${data.id}`);
      router.refresh();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Gagal" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <p className="card-title">Impor e-Statement</p>
      {msg && (
        <div className={`rounded-lg text-sm px-3 py-2 border ${msg.type === "ok" ? "bg-brand-green/10 border-brand-green/30 text-brand-green" : "bg-brand-red/10 border-brand-red/30 text-brand-red"}`}>{msg.text}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Rekening</label>
          <select className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Format Bank</label>
          <select className="input" value={bank} onChange={(e) => setBank(e.target.value)}>
            <option value="generic">Otomatis / Generic</option>
            <option value="bca">BCA</option>
            <option value="mandiri">Mandiri</option>
            <option value="bni">BNI</option>
            <option value="bri">BRI</option>
          </select>
        </div>
        <div>
          <label className="label">File CSV</label>
          <input type="file" accept=".csv,text/csv,text/plain" className="input" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
        </div>
      </div>
      <button className="btn-primary text-sm" disabled={busy}>{busy ? "Memproses..." : "Impor & Cocokkan Otomatis"}</button>
      <p className="text-[11px] text-slate-500">Sistem membaca kolom tanggal, keterangan, debit/kredit (atau mutasi DB/CR), dan saldo. Baris dicocokkan otomatis dengan transaksi rekening yang sama.</p>
    </form>
  );
}
