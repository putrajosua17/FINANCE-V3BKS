"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { formatRupiah, formatRupiahShort, namaBulan } from "@/lib/format";

type Row = { bulan: number; income: number; expense: number; profit: number };

export default function TrenBulananChart({ data }: { data: Row[] }) {
  const rows = data.map((r) => ({ ...r, label: namaBulan(r.bulan) }));
  if (!rows.length) {
    return <div className="h-[220px] flex items-center justify-center text-sm text-slate-500">Belum ada data</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={rows} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1c2532" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={(v) => formatRupiahShort(v)} tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} width={54} />
        <Tooltip
          contentStyle={{ background: "#151c28", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }}
          formatter={(v: number, n) => [formatRupiah(v), n]}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
        <Bar dataKey="income" name="Pemasukan" fill="#22c55e" radius={[3, 3, 0, 0]} />
        <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[3, 3, 0, 0]} />
        <Bar dataKey="profit" name="Profit" fill="#3b82f6" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
