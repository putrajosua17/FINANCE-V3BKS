"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/format";

type Row = { tanggal: string; tipe: string; kategori: string; jumlah: string; rekening: string; keterangan: string; kode: string };
const COLS = ["tanggal", "tipe", "kategori", "jumlah", "rekening", "keterangan", "kode"] as const;

const CONTOH = `tanggal,tipe,kategori,jumlah,rekening,keterangan,kode
2026-08-10,income,Rental,960000,BCA,Booking Andi FC,WD3
2026-08-10,expense,Listrik,1500000,BCA,Token listrik,
2026-08-11,income,Photographer,300000,Cash,Foto tim Beta,PG1`;

// CSV parser sederhana (mendukung field ber-tanda kutip)
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let field = "", row: string[] = [], inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some((f) => f.trim() !== "")) rows.push(row); }
  return rows;
}

export default function ImportClient() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [result, setResult] = useState<{ created: number; gagal: number; errors: { baris: number; pesan: string }[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function preview(text: string) {
    setErr(""); setResult(null);
    const grid = parseCSV(text);
    if (grid.length < 2) { setRows([]); if (text.trim()) setErr("Butuh header + minimal 1 baris data."); return; }
    const header = grid[0].map((h) => h.trim().toLowerCase());
    const idx = (name: string) => header.indexOf(name);
    const parsed: Row[] = grid.slice(1).map((r) => ({
      tanggal: r[idx("tanggal")] ?? "",
      tipe: r[idx("tipe")] ?? "",
      kategori: r[idx("kategori")] ?? "",
      jumlah: r[idx("jumlah")] ?? "",
      rekening: r[idx("rekening")] ?? "",
      keterangan: r[idx("keterangan")] ?? "",
      kode: r[idx("kode")] ?? "",
    }));
    setRows(parsed);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { const t = String(reader.result || ""); setRaw(t); preview(t); };
    reader.readAsText(file);
  }

  async function submit() {
    if (rows.length === 0) return;
    setBusy(true); setErr("");
    const res = await fetch("/api/transactions/import", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(data.error || "Gagal"); return; }
    setResult(data);
    if (data.created > 0) router.refresh();
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="card">
        <p className="card-title mb-2">Format Kolom (CSV)</p>
        <p className="text-xs text-slate-400 mb-2">
          Baris pertama = header. Kolom: <code className="text-brand-green">{COLS.join(", ")}</code>.
          Nama <b>kategori</b> & <b>rekening</b> harus sama persis dengan yang ada di sistem. <b>tipe</b> = income/expense (atau masuk/keluar).
        </p>
        <pre className="bg-ink-800 rounded-lg p-3 text-[11px] text-slate-300 overflow-x-auto">{CONTOH}</pre>
        <div className="flex flex-wrap gap-2 mt-3">
          <button className="btn-ghost text-xs" onClick={() => { setRaw(CONTOH); preview(CONTOH); }}>Isi Contoh</button>
          <a className="btn-ghost text-xs" download="template_impor_v3bks.csv"
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(CONTOH)}`}>⬇️ Unduh Template</a>
          <label className="btn-ghost text-xs cursor-pointer">
            📁 Pilih File CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
          </label>
        </div>
      </div>

      <div className="card">
        <p className="card-title mb-2">Tempel Data CSV</p>
        <textarea className="input min-h-[140px] font-mono text-xs" value={raw}
          onChange={(e) => { setRaw(e.target.value); preview(e.target.value); }}
          placeholder="Tempel isi CSV di sini..." />
        {err && <p className="text-brand-red text-sm mt-2">{err}</p>}
      </div>

      {rows.length > 0 && (
        <div className="card p-0 overflow-x-auto">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <p className="card-title">Pratinjau · {rows.length} baris</p>
            <button className="btn-primary text-xs" onClick={submit} disabled={busy}>
              {busy ? "Mengimpor..." : `Impor ${rows.length} Transaksi`}
            </button>
          </div>
          <table className="w-full text-xs min-w-[720px]">
            <thead><tr className="text-left uppercase text-slate-500">
              {COLS.map((c) => <th key={c} className="px-3 py-2">{c}</th>)}
            </tr></thead>
            <tbody>
              {rows.slice(0, 50).map((r, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="px-3 py-1.5 text-slate-300">{r.tanggal}</td>
                  <td className="px-3 py-1.5"><span className={r.tipe.toLowerCase().startsWith("i") || r.tipe.toLowerCase().startsWith("m") ? "text-brand-green" : "text-brand-red"}>{r.tipe}</span></td>
                  <td className="px-3 py-1.5 text-slate-300">{r.kategori}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-slate-200">{formatRupiah(Number(String(r.jumlah).replace(/[^0-9.-]/g, "")))}</td>
                  <td className="px-3 py-1.5 text-slate-400">{r.rekening}</td>
                  <td className="px-3 py-1.5 text-slate-500 max-w-[200px] truncate">{r.keterangan}</td>
                  <td className="px-3 py-1.5 text-slate-500">{r.kode}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 50 && <p className="px-4 py-2 text-[11px] text-slate-500">…dan {rows.length - 50} baris lainnya.</p>}
        </div>
      )}

      {result && (
        <div className="card">
          <p className="card-title mb-2">Hasil Impor</p>
          <div className="flex gap-4 text-sm">
            <span className="text-brand-green">✓ {result.created} berhasil</span>
            {result.gagal > 0 && <span className="text-brand-red">✗ {result.gagal} gagal</span>}
          </div>
          {result.errors.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-brand-red">
              {result.errors.slice(0, 30).map((e, i) => <li key={i}>Baris {e.baris}: {e.pesan}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
