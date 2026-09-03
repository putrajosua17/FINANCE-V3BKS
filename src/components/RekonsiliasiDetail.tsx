"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah, formatTanggalPendek } from "@/lib/format";

type Matched = { label: string; jumlah: number } | null;
type Suggestion = { txId: string; skor: number; label: string; jumlah: number } | null;

export type ReconLine = {
  id: string;
  tanggal: string;
  keterangan: string;
  debit: number;
  kredit: number;
  status: string; // belum | cocok | manual | diabaikan
  skorCocok: number | null;
  matched: Matched;
  suggestion: Suggestion;
};

type Props = {
  statementId: string;
  status: string;
  canFinalize: boolean;
  lines: ReconLine[];
  categories: { id: string; nama: string; tipe: string }[];
  businessUnits: { id: string; nama: string; induk: string }[];
};

export default function RekonsiliasiDetail({ statementId, status, canFinalize, lines, categories, businessUnits }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState<string | null>(null);
  const [catId, setCatId] = useState("");
  const [buId, setBuId] = useState(businessUnits[0]?.id ?? "");

  async function act(action: string, payload: Record<string, unknown>, key: string) {
    setBusy(key);
    setErr(null);
    try {
      const res = await fetch(`/api/rekonsiliasi/${statementId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      setOpenCreate(null);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(null);
    }
  }

  const done = status === "selesai";

  return (
    <div className="space-y-3">
      {err && <div className="rounded-lg text-sm px-3 py-2 border bg-brand-red/10 border-brand-red/30 text-brand-red">{err}</div>}

      {!done && (
        <button
          onClick={() => act("finalize", {}, "finalize")}
          disabled={!canFinalize || busy === "finalize"}
          className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          title={canFinalize ? "" : "Selesaikan semua baris & pastikan saldo cocok"}
        >
          ✅ Selesaikan Rekonsiliasi
        </button>
      )}
      {done && <div className="rounded-lg px-4 py-2 text-sm border border-brand-green/30 bg-brand-green/10 text-brand-green">Rekonsiliasi selesai — saldo cocok.</div>}

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="text-left text-[11px] uppercase text-slate-500">
              <th className="px-3 py-2 font-semibold">Tgl</th>
              <th className="px-3 py-2 font-semibold">Keterangan Bank</th>
              <th className="px-3 py-2 font-semibold text-right">Keluar</th>
              <th className="px-3 py-2 font-semibold text-right">Masuk</th>
              <th className="px-3 py-2 font-semibold">Transaksi Sistem</th>
              <th className="px-3 py-2 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} className="border-t border-white/5 align-top">
                <td className="px-3 py-2 text-slate-400 tabular-nums whitespace-nowrap">{formatTanggalPendek(l.tanggal)}</td>
                <td className="px-3 py-2 text-slate-300 max-w-[220px]">{l.keterangan}</td>
                <td className="px-3 py-2 text-right tabular-nums text-brand-red">{l.debit ? formatRupiah(l.debit) : "-"}</td>
                <td className="px-3 py-2 text-right tabular-nums text-brand-green">{l.kredit ? formatRupiah(l.kredit) : "-"}</td>
                <td className="px-3 py-2">
                  {l.matched ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${l.status === "manual" ? "bg-brand-blue/15 text-brand-blue" : "bg-brand-green/15 text-brand-green"}`}>{l.status === "manual" ? "dibuat" : "cocok"}</span>
                      <span className="text-slate-300">{l.matched.label}</span>
                    </span>
                  ) : l.status === "diabaikan" ? (
                    <span className="text-slate-500 text-xs">diabaikan</span>
                  ) : l.suggestion ? (
                    <span className="text-slate-400 text-xs">Saran: {l.suggestion.label} <span className="text-brand-amber">({Math.round(l.suggestion.skor * 100)}%)</span></span>
                  ) : (
                    <span className="text-slate-600 text-xs">belum cocok</span>
                  )}

                  {openCreate === l.id && !done && (
                    <div className="mt-2 flex flex-wrap gap-2 items-end bg-ink-800 p-2 rounded-lg">
                      <div>
                        <label className="label">Kategori ({l.kredit > 0 ? "pemasukan" : "pengeluaran"})</label>
                        <select className="input py-1 text-xs" value={catId} onChange={(e) => setCatId(e.target.value)}>
                          <option value="">— pilih —</option>
                          {categories.filter((c) => c.tipe === (l.kredit > 0 ? "income" : "expense")).map((c) => (
                            <option key={c.id} value={c.id}>{c.nama}</option>
                          ))}
                        </select>
                      </div>
                      {businessUnits.length > 0 && (
                        <div>
                          <label className="label">Unit</label>
                          <select className="input py-1 text-xs" value={buId} onChange={(e) => setBuId(e.target.value)}>
                            {businessUnits.map((u) => <option key={u.id} value={u.id}>{u.nama}</option>)}
                          </select>
                        </div>
                      )}
                      <button className="btn-primary text-xs" disabled={!catId || busy === l.id}
                        onClick={() => act("create-tx", { lineId: l.id, categoryId: catId, businessUnitId: buId }, l.id)}>
                        Simpan
                      </button>
                      <button className="btn-ghost text-xs" onClick={() => setOpenCreate(null)}>Batal</button>
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  {done ? null : l.matched ? (
                    <button className="btn-ghost text-[11px]" disabled={busy === l.id} onClick={() => act("unmatch", { lineId: l.id }, l.id)}>Batalkan</button>
                  ) : l.status === "diabaikan" ? (
                    <button className="btn-ghost text-[11px]" disabled={busy === l.id} onClick={() => act("unmatch", { lineId: l.id }, l.id)}>Pulihkan</button>
                  ) : (
                    <div className="flex gap-1 justify-end">
                      {l.suggestion && (
                        <button className="btn-primary text-[11px]" disabled={busy === l.id}
                          onClick={() => act("match", { lineId: l.id, transactionId: l.suggestion!.txId, skor: l.suggestion!.skor }, l.id)}>
                          Cocokkan
                        </button>
                      )}
                      <button className="btn-ghost text-[11px]" onClick={() => { setOpenCreate(l.id); setCatId(""); }}>Buat tx</button>
                      <button className="btn-ghost text-[11px]" disabled={busy === l.id} onClick={() => act("ignore", { lineId: l.id }, l.id)}>Abaikan</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
