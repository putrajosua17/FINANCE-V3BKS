"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseV3bksCsv } from "@/lib/v3bks-import";
import { formatRupiah } from "@/lib/format";
export const STATUS: Record<string, string> = { draft: "Draf", needs_fix: "Perlu perbaikan", submitted: "Menunggu finance", approved: "Disetujui", rejected: "Ditolak" };
export default function ImportClient() {
  const router = useRouter();
  const [csv, setCsv] = useState(""); const [fileName, setFileName] = useState("tracker.csv");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [items, setItems] = useState<{ id: string; fileName: string; status: string; uploadedByName: string; createdAt: string; _count: { lines: number } }[]>([]);
  useEffect(() => { fetch("/api/imports").then(r => r.json()).then(d => setItems(d.items || [])).catch(() => setError("Riwayat belum termuat. Periksa koneksi.")); }, []);
  const preview = useMemo(() => csv ? parseV3bksCsv(csv) : null,[csv]);
  async function upload() {
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/imports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csv, fileName }) });
      const data = await r.json(); if (!r.ok) throw new Error(data.error || "Gagal membuat draf.");
      router.push(`/transaksi/impor/${data.id}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Koneksi gagal. File masih tersedia di halaman ini."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6 max-w-5xl mx-auto">
    <div className="rounded-2xl bg-brand-green/10 border border-brand-green/20 p-6"><p className="text-brand-green text-xs font-semibold uppercase tracking-widest">Tracker → Pemeriksaan → Laporan</p><h2 className="text-2xl font-bold mt-2">Pusat impor tracker</h2><p className="text-slate-400 mt-2 text-sm">Unggah CSV asli V3BKS. Finance memeriksa dan menyetujui sebelum saldo berubah.</p></div>
    <section className="card space-y-4"><label className="block text-sm font-medium">File CSV tracker<input disabled={busy} className="block mt-3 w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:p-3 file:bg-brand-green file:text-black" type="file" accept=".csv,text/csv" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; setError(""); if (f.size > 1500000) { setError("Maksimal 1,5 MB."); return; } try { setCsv(await f.text()); setFileName(f.name); } catch { setError("File tidak dapat dibaca."); } }} /></label>
    {preview && <><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-ink-800 p-4"><p className="text-xs text-slate-400">Pemasukan</p><b className="text-brand-green">{formatRupiah(preview.totalIncome)}</b></div><div className="rounded-xl bg-ink-800 p-4"><p className="text-xs text-slate-400">Pengeluaran</p><b>{formatRupiah(preview.totalExpense)}</b></div></div><p className="text-sm text-slate-400">{preview.rows.length} transaksi terbaca · {preview.skippedIncome} baris tanpa pembayaran dilewati.</p><button disabled={busy || !preview.rows.length || preview.errors.length>0} className="btn-primary w-full sm:w-auto min-h-12" onClick={upload}>{busy ? "Menyimpan draf…" : "Buat / buka draf pemeriksaan"}</button></>}
    {preview?.errors.map(message=><p key={message} role="alert" className="text-brand-red text-sm">{message}</p>)}
    {error && <p role="alert" className="text-brand-red">{error}</p>}</section>
    <section><h3 className="font-semibold mb-3">Riwayat unggahan</h3><div className="space-y-3">{items.map(item => <Link key={item.id} href={`/transaksi/impor/${item.id}`} className="card block hover:border-brand-green/40"><div className="flex flex-wrap justify-between gap-2"><strong className="break-words">{item.fileName}</strong><span className="text-brand-green text-sm">{STATUS[item.status]}</span></div><p className="text-xs text-slate-400 mt-2">{item.uploadedByName} · {new Date(item.createdAt).toLocaleDateString("id-ID")} · {item._count.lines} baris</p></Link>)}{!items.length && <p className="text-slate-500">Belum ada unggahan.</p>}</div></section>
  </div>;
}
