"use client";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { formatRupiah, formatRupiahShort } from "@/lib/format";

type Row = { hari: number; income: number; expense: number; net: number };

export default function ArusKasChart({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1c2532" vertical={false} />
        <XAxis dataKey="hari" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
        <YAxis tickFormatter={(v) => formatRupiahShort(v)} tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} width={54} />
        <Tooltip
          contentStyle={{ background: "#151c28", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#94a3b8" }}
          formatter={(v: number, n) => [formatRupiah(v), n === "income" ? "Pemasukan" : "Pengeluaran"]}
          labelFormatter={(l) => `Tanggal ${l}`}
        />
        <Area type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} fill="url(#gIncome)" />
        <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#gExpense)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
