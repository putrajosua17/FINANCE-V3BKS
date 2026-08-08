"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/format";

type RateCard = { id: string; kode: string; nama: string; kelompok: string; harga: number; isActive: boolean; hari: string | null; durasi: number | null };
type Category = { id: string; nama: string; tipe: string; isRecurring: boolean; isActive: boolean };
type Account = { id: string; nama: string; tipe: string; saldoAwal: number; isActive: boolean };
type UserRow = { id: string; nama: string; email: string; role: string; isActive: boolean };
type Setting = { key: string; value: string };

async function api(method: string, url: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

const TABS = ["Tarif", "Kategori", "Rekening", "Pengguna", "Parameter"] as const;
type Tab = (typeof TABS)[number];

export default function PengaturanClient({
  rateCards, categories, accounts, users, settings, role,
}: {
  rateCards: RateCard[]; categories: Category[]; accounts: Account[];
  users: UserRow[]; settings: Setting[]; role: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Tarif");
  const [msg, setMsg] = useState<{ t: "ok" | "err"; s: string } | null>(null);
  const canManageUsers = role === "owner" || role === "admin";

  function flash(t: "ok" | "err", s: string) {
    setMsg({ t, s });
    setTimeout(() => setMsg(null), 3000);
  }
  async function run(p: Promise<{ ok: boolean; data: { error?: string } }>, okMsg: string) {
    const { ok, data } = await p;
    if (ok) { flash("ok", okMsg); router.refresh(); }
    else flash("err", data.error || "Gagal");
    return ok;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 flex-wrap">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm ${tab === t ? "bg-brand-green text-black font-medium" : "bg-ink-800 text-slate-400 hover:text-slate-200"}`}>
            {t}
          </button>
        ))}
      </div>

      {msg && (
        <div className={`rounded-lg text-sm px-3 py-2 border ${msg.t === "ok" ? "bg-brand-green/10 border-brand-green/30 text-brand-green" : "bg-brand-red/10 border-brand-red/30 text-brand-red"}`}>
          {msg.s}
        </div>
      )}

      {tab === "Tarif" && <TarifSection rateCards={rateCards} run={run} />}
      {tab === "Kategori" && <KategoriSection categories={categories} run={run} />}
      {tab === "Rekening" && <RekeningSection accounts={accounts} run={run} />}
      {tab === "Pengguna" && <PenggunaSection users={users} run={run} canManage={canManageUsers} role={role} />}
      {tab === "Parameter" && <ParameterSection settings={settings} run={run} />}
    </div>
  );
}

type RunFn = (p: Promise<{ ok: boolean; data: { error?: string } }>, okMsg: string) => Promise<boolean>;

/* ---------------- Tarif ---------------- */
function TarifSection({ rateCards, run }: { rateCards: RateCard[]; run: RunFn }) {
  const [f, setF] = useState({ kode: "", nama: "", kelompok: "RENTAL", harga: "", durasi: "1", hari: "" });
  const groups = ["RENTAL", "PHOTOGRAPHER", "WASIT", "ROMPI", "VIDEO", "MEMBER"];
  return (
    <div className="space-y-3">
      <div className="card">
        <p className="card-title mb-3">Tambah Tarif</p>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          <input className="input" placeholder="Kode" value={f.kode} onChange={(e) => setF({ ...f, kode: e.target.value.toUpperCase() })} />
          <input className="input sm:col-span-2" placeholder="Nama" value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} />
          <select className="input" value={f.kelompok} onChange={(e) => setF({ ...f, kelompok: e.target.value })}>
            {groups.map((g) => <option key={g}>{g}</option>)}
          </select>
          <input className="input" type="number" placeholder="Harga" value={f.harga} onChange={(e) => setF({ ...f, harga: e.target.value })} />
          <button className="btn-primary text-xs"
            onClick={async () => {
              const ok = await run(api("POST", "/api/rate-cards", { ...f, durasi: f.durasi, hari: f.hari || null }), "Tarif ditambahkan");
              if (ok) setF({ kode: "", nama: "", kelompok: "RENTAL", harga: "", durasi: "1", hari: "" });
            }}>Tambah</button>
        </div>
      </div>
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead><tr className="text-left text-[11px] uppercase text-slate-500">
            <th className="px-4 py-2">Kode</th><th className="px-4 py-2">Nama</th><th className="px-4 py-2">Kelompok</th>
            <th className="px-4 py-2 text-right">Harga</th><th className="px-4 py-2 text-right">Aksi</th>
          </tr></thead>
          <tbody>
            {rateCards.map((r) => <TarifRow key={r.id} r={r} run={run} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function TarifRow({ r, run }: { r: RateCard; run: RunFn }) {
  const [edit, setEdit] = useState(false);
  const [harga, setHarga] = useState(String(r.harga));
  return (
    <tr className={`border-t border-white/5 ${!r.isActive ? "opacity-50" : ""}`}>
      <td className="px-4 py-2.5 text-slate-200 font-medium">{r.kode}</td>
      <td className="px-4 py-2.5 text-slate-400">{r.nama}</td>
      <td className="px-4 py-2.5"><span className="badge bg-ink-700 text-slate-300">{r.kelompok}</span></td>
      <td className="px-4 py-2.5 text-right tabular-nums">
        {edit ? <input className="input w-28 text-right py-1" type="number" value={harga} onChange={(e) => setHarga(e.target.value)} />
          : <span className="text-slate-200">{formatRupiah(r.harga)}</span>}
      </td>
      <td className="px-4 py-2.5 text-right whitespace-nowrap">
        {edit ? (
          <button className="btn-primary text-xs py-1 mr-1" onClick={async () => { if (await run(api("PATCH", `/api/rate-cards/${r.id}`, { harga }), "Tersimpan")) setEdit(false); }}>Simpan</button>
        ) : (
          <button className="text-slate-500 hover:text-brand-green text-xs mr-3" onClick={() => setEdit(true)}>Edit</button>
        )}
        <button className="text-slate-500 hover:text-brand-red text-xs" onClick={() => run(api("DELETE", `/api/rate-cards/${r.id}`), "Dihapus")}>Hapus</button>
      </td>
    </tr>
  );
}

/* ---------------- Kategori ---------------- */
function KategoriSection({ categories, run }: { categories: Category[]; run: RunFn }) {
  const [f, setF] = useState({ nama: "", tipe: "expense", isRecurring: false });
  const income = categories.filter((c) => c.tipe === "income");
  const expense = categories.filter((c) => c.tipe === "expense");
  return (
    <div className="space-y-3">
      <div className="card">
        <p className="card-title mb-3">Tambah Kategori</p>
        <div className="flex flex-wrap gap-2 items-center">
          <input className="input max-w-xs" placeholder="Nama kategori" value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} />
          <select className="input max-w-[160px]" value={f.tipe} onChange={(e) => setF({ ...f, tipe: e.target.value })}>
            <option value="income">Pemasukan</option><option value="expense">Pengeluaran</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <input type="checkbox" checked={f.isRecurring} onChange={(e) => setF({ ...f, isRecurring: e.target.checked })} /> Rutin
          </label>
          <button className="btn-primary text-xs" onClick={async () => {
            if (await run(api("POST", "/api/categories", f), "Kategori ditambahkan")) setF({ nama: "", tipe: "expense", isRecurring: false });
          }}>Tambah</button>
        </div>
      </div>
      {[["Pemasukan", income], ["Pengeluaran", expense]].map(([label, list]) => (
        <div key={label as string} className="card">
          <p className="card-title mb-3">{label as string}</p>
          <div className="flex flex-wrap gap-2">
            {(list as Category[]).map((c) => (
              <span key={c.id} className={`badge gap-1.5 ${c.tipe === "income" ? "bg-brand-green/15 text-brand-green" : "bg-brand-red/15 text-brand-red"} ${!c.isActive ? "opacity-40" : ""}`}>
                {c.nama}{c.isRecurring && <span className="text-[9px] opacity-70">·rutin</span>}
                <button className="ml-1 hover:text-white" onClick={() => run(api("DELETE", `/api/categories/${c.id}`), "Diperbarui")}>×</button>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Rekening ---------------- */
function RekeningSection({ accounts, run }: { accounts: Account[]; run: RunFn }) {
  const [f, setF] = useState({ nama: "", tipe: "bank", saldoAwal: "" });
  return (
    <div className="space-y-3">
      <div className="card">
        <p className="card-title mb-3">Tambah Rekening</p>
        <div className="flex flex-wrap gap-2 items-center">
          <input className="input max-w-xs" placeholder="Nama rekening" value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} />
          <select className="input max-w-[140px]" value={f.tipe} onChange={(e) => setF({ ...f, tipe: e.target.value })}>
            <option value="bank">Bank</option><option value="cash">Cash</option>
          </select>
          <input className="input max-w-[160px]" type="number" placeholder="Saldo awal" value={f.saldoAwal} onChange={(e) => setF({ ...f, saldoAwal: e.target.value })} />
          <button className="btn-primary text-xs" onClick={async () => {
            if (await run(api("POST", "/api/accounts", f), "Rekening ditambahkan")) setF({ nama: "", tipe: "bank", saldoAwal: "" });
          }}>Tambah</button>
        </div>
      </div>
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead><tr className="text-left text-[11px] uppercase text-slate-500">
            <th className="px-4 py-2">Nama</th><th className="px-4 py-2">Tipe</th><th className="px-4 py-2 text-right">Saldo Awal</th><th className="px-4 py-2 text-right">Aksi</th>
          </tr></thead>
          <tbody>
            {accounts.map((a) => <RekeningRow key={a.id} a={a} run={run} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function RekeningRow({ a, run }: { a: Account; run: RunFn }) {
  const [edit, setEdit] = useState(false);
  const [saldo, setSaldo] = useState(String(a.saldoAwal));
  return (
    <tr className={`border-t border-white/5 ${!a.isActive ? "opacity-50" : ""}`}>
      <td className="px-4 py-2.5 text-slate-200">{a.nama}</td>
      <td className="px-4 py-2.5 text-slate-400">{a.tipe}</td>
      <td className="px-4 py-2.5 text-right tabular-nums">
        {edit ? <input className="input w-28 text-right py-1" type="number" value={saldo} onChange={(e) => setSaldo(e.target.value)} />
          : <span className="text-slate-300">{formatRupiah(a.saldoAwal)}</span>}
      </td>
      <td className="px-4 py-2.5 text-right whitespace-nowrap">
        {edit ? (
          <button className="btn-primary text-xs py-1 mr-1" onClick={async () => { if (await run(api("PATCH", `/api/accounts/${a.id}`, { saldoAwal: saldo }), "Tersimpan")) setEdit(false); }}>Simpan</button>
        ) : (
          <button className="text-slate-500 hover:text-brand-green text-xs mr-3" onClick={() => setEdit(true)}>Edit</button>
        )}
        <button className="text-slate-500 hover:text-brand-red text-xs" onClick={() => run(api("DELETE", `/api/accounts/${a.id}`), "Diperbarui")}>Hapus</button>
      </td>
    </tr>
  );
}

/* ---------------- Pengguna ---------------- */
function PenggunaSection({ users, run, canManage, role }: { users: UserRow[]; run: RunFn; canManage: boolean; role: string }) {
  const [f, setF] = useState({ nama: "", email: "", password: "", role: "admin" });
  if (!canManage) return <div className="card text-sm text-slate-400">Hanya Owner/Admin yang dapat mengelola pengguna.</div>;
  return (
    <div className="space-y-3">
      <div className="card">
        <p className="card-title mb-3">Tambah Pengguna</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <input className="input" placeholder="Nama" value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} />
          <input className="input" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <input className="input" type="password" placeholder="Password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          <select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
            <option value="admin">Admin</option><option value="finance">Finance</option>
            {role === "owner" && <option value="owner">Owner</option>}
          </select>
          <button className="btn-primary text-xs" onClick={async () => {
            if (await run(api("POST", "/api/users", f), "Pengguna ditambahkan")) setF({ nama: "", email: "", password: "", role: "admin" });
          }}>Tambah</button>
        </div>
      </div>
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead><tr className="text-left text-[11px] uppercase text-slate-500">
            <th className="px-4 py-2">Nama</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Role</th><th className="px-4 py-2 text-right">Status / Aksi</th>
          </tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={`border-t border-white/5 ${!u.isActive ? "opacity-50" : ""}`}>
                <td className="px-4 py-2.5 text-slate-200">{u.nama}</td>
                <td className="px-4 py-2.5 text-slate-400">{u.email}</td>
                <td className="px-4 py-2.5">
                  <select className="input py-1 w-28 text-xs" defaultValue={u.role}
                    onChange={(e) => run(api("PATCH", `/api/users/${u.id}`, { role: e.target.value }), "Role diperbarui")}>
                    <option value="admin">admin</option><option value="finance">finance</option><option value="owner">owner</option>
                  </select>
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <button className="text-slate-500 hover:text-brand-amber text-xs mr-3"
                    onClick={() => run(api("PATCH", `/api/users/${u.id}`, { isActive: !u.isActive }), "Status diperbarui")}>
                    {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Parameter ---------------- */
function ParameterSection({ settings, run }: { settings: Setting[]; run: RunFn }) {
  const [vals, setVals] = useState<Record<string, string>>(Object.fromEntries(settings.map((s) => [s.key, s.value])));
  const LABELS: Record<string, string> = {
    app_name: "Nama Aplikasi",
    pph_final_persen: "PPh Final (%)",
    pajak_daerah_persen: "Pajak Daerah (%)",
    target_harian_default: "Target Harian Default (Rp)",
    periode_aktif: "Periode Aktif (YYYY-MM)",
    currency: "Mata Uang",
  };
  return (
    <div className="card">
      <p className="card-title mb-3">Parameter Aplikasi</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {settings.map((s) => (
          <div key={s.key}>
            <label className="label">{LABELS[s.key] || s.key}</label>
            <input className="input" value={vals[s.key] ?? ""} onChange={(e) => setVals({ ...vals, [s.key]: e.target.value })} />
          </div>
        ))}
      </div>
      <button className="btn-primary text-xs mt-4"
        onClick={() => run(api("POST", "/api/settings", { settings: Object.entries(vals).map(([key, value]) => ({ key, value })) }), "Pengaturan disimpan")}>
        Simpan Perubahan
      </button>
    </div>
  );
}
