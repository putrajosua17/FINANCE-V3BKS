"use client";

import { useEffect, useState, useCallback } from "react";
import { formatRupiah, formatTanggal } from "@/lib/format";

type Tx = {
  id: string;
  tanggal: string;
  tipe: string;
  jumlah: number;
  namaEntitas: string | null;
  catatan: string | null;
  tempatBeli: string | null;
  rateCode: string | null;
  category: { nama: string };
  account: { nama: string };
};

export default function RiwayatTable() {
  const [items, setItems] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipe, setTipe] = useState("");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (tipe) sp.set("tipe", tipe);
    if (q) sp.set("q", q);
    const res = await fetch(`/api/transactions?${sp.toString()}`);
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }, [tipe, q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function del(id: string) {
    if (!confirm("Hapus transaksi ini?")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    load();
  }

  const totalIn = items.filter((i) => i.tipe === "income").reduce((s, i) => s + i.jumlah, 0);
  const totalOut = items.filter((i) => i.tipe === "expense").reduce((s, i) => s + i.jumlah, 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <input className="input max-w-xs" placeholder="Cari entitas, catatan, no. HP..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-[160px]" value={tipe} onChange={(e) => setTipe(e.target.value)}>
          <option value="">Semua tipe</option>
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
        </select>
        <div className="ml-auto flex gap-3 text-xs">
          <span className="text-brand-green">Masuk: {formatRupiah(totalIn)}</span>
          <span className="text-brand-red">Keluar: {formatRupiah(totalOut)}</span>
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-[11px] uppercase text-slate-500 border-b border-white/5">
              <th className="px-4 py-3 font-semibold">Tanggal</th>
              <th className="px-4 py-3 font-semibold">Tipe</th>
              <th className="px-4 py-3 font-semibold">Kategori</th>
              <th className="px-4 py-3 font-semibold">Keterangan</th>
              <th className="px-4 py-3 font-semibold">Rekening</th>
              <th className="px-4 py-3 font-semibold text-right">Jumlah</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Memuat...</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Belum ada transaksi.</td></tr>
            )}
            {!loading && items.map((t) => (
              <tr key={t.id} className="border-b border-white/5 hover:bg-ink-800/50">
                <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{formatTanggal(t.tanggal)}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${t.tipe === "income" ? "bg-brand-green/15 text-brand-green" : "bg-brand-red/15 text-brand-red"}`}>
                    {t.tipe === "income" ? "Masuk" : "Keluar"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300">{t.category.nama}</td>
                <td className="px-4 py-3 text-slate-400 max-w-[240px] truncate">
                  {t.namaEntitas || t.tempatBeli || t.catatan || "-"}
                  {t.rateCode && <span className="text-slate-600 ml-1">· {t.rateCode}</span>}
                </td>
                <td className="px-4 py-3 text-slate-400">{t.account.nama}</td>
                <td className={`px-4 py-3 text-right tabular-nums font-medium ${t.tipe === "income" ? "text-brand-green" : "text-brand-red"}`}>
                  {t.tipe === "income" ? "+" : "−"}{formatRupiah(t.jumlah)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => del(t.id)} className="text-slate-500 hover:text-brand-red text-xs">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
