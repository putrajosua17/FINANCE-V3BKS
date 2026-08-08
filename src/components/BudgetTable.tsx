"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah, formatPercent } from "@/lib/format";

type Row = {
  categoryId: string;
  nama: string;
  budget: number;
  realisasi: number;
  sisa: number;
  persen: number;
  status: "aman" | "waspada" | "over";
};

const BAR: Record<Row["status"], string> = {
  aman: "bg-brand-green",
  waspada: "bg-brand-amber",
  over: "bg-brand-red",
};
const BADGE: Record<Row["status"], string> = {
  aman: "bg-brand-green/15 text-brand-green",
  waspada: "bg-brand-amber/15 text-brand-amber",
  over: "bg-brand-red/15 text-brand-red",
};

export default function BudgetTable({ rows, periode }: { rows: Row[]; periode: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(categoryId: string) {
    setSaving(true);
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, periode, nominal: Number(val) || 0 }),
    });
    setSaving(false);
    setEditing(null);
    router.refresh();
  }

  return (
    <div className="card p-0 overflow-x-auto">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <p className="card-title">Anggaran vs Realisasi · {periode}</p>
        {rows.some((r) => r.status === "over") && (
          <span className="badge bg-brand-red/15 text-brand-red">
            {rows.filter((r) => r.status === "over").length} kategori over-budget
          </span>
        )}
      </div>
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="text-left text-[11px] uppercase text-slate-500">
            <th className="px-4 py-2 font-semibold">Kategori</th>
            <th className="px-4 py-2 font-semibold text-right">Anggaran</th>
            <th className="px-4 py-2 font-semibold text-right">Realisasi</th>
            <th className="px-4 py-2 font-semibold w-40">Progres</th>
            <th className="px-4 py-2 font-semibold text-right">Sisa</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.categoryId} className="border-t border-white/5">
              <td className="px-4 py-3 text-slate-200">
                {r.nama}
                <span className={`badge ml-2 ${BADGE[r.status]}`}>{r.status}</span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {editing === r.categoryId ? (
                  <input
                    autoFocus
                    type="number"
                    className="input w-32 text-right py-1"
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && save(r.categoryId)}
                  />
                ) : (
                  <span className="text-slate-300">{formatRupiah(r.budget)}</span>
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-200">{formatRupiah(r.realisasi)}</td>
              <td className="px-4 py-3">
                <div className="w-full h-1.5 rounded-full bg-ink-700 overflow-hidden">
                  <div className={`h-full ${BAR[r.status]}`} style={{ width: `${Math.min(100, r.persen)}%` }} />
                </div>
                <span className="text-[10px] text-slate-500">{formatPercent(r.persen)}</span>
              </td>
              <td className={`px-4 py-3 text-right tabular-nums ${r.sisa < 0 ? "text-brand-red" : "text-slate-400"}`}>
                {formatRupiah(r.sisa)}
              </td>
              <td className="px-4 py-3 text-right">
                {editing === r.categoryId ? (
                  <button onClick={() => save(r.categoryId)} disabled={saving} className="btn-primary text-xs py-1">
                    {saving ? "..." : "Simpan"}
                  </button>
                ) : (
                  <button
                    onClick={() => { setEditing(r.categoryId); setVal(String(r.budget)); }}
                    className="text-slate-500 hover:text-brand-green text-xs"
                  >
                    Atur
                  </button>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Belum ada anggaran.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
