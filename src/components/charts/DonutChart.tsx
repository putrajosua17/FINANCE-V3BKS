"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { formatRupiah } from "@/lib/format";

type Row = { nama: string; nilai: number; persen: number };

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6", "#ec4899", "#eab308"];

export default function DonutChart({ data }: { data: Row[] }) {
  if (!data.length) {
    return <div className="h-[220px] flex items-center justify-center text-sm text-slate-500">Belum ada data</div>;
  }
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="w-[180px] h-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="nilai" nameKey="nama" cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#151c28", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number, n) => [formatRupiah(v), n]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-1.5 w-full">
        {data.slice(0, 6).map((r, i) => (
          <li key={r.nama} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-slate-300 truncate flex-1">{r.nama}</span>
            <span className="text-slate-500">{r.persen.toFixed(1)}%</span>
            <span className="text-slate-200 font-medium tabular-nums">{formatRupiah(r.nilai)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
