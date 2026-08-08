"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; nama: string; tipe: string };
type Account = { id: string; nama: string };
type RateCard = { id: string; kode: string; nama: string; kelompok: string; harga: number };

export type TxInitial = {
  id: string; tipe: "income" | "expense"; tanggal: string; categoryId: string; accountId: string;
  jumlah: string; catatan?: string; rateCode?: string; jam?: string; durasi?: string;
  namaEntitas?: string; noHp?: string; statusBayar?: string; tempatBeli?: string;
};

export default function TransactionForm({
  categories, accounts, rateCards, defaultTipe = "income", quick = false, initial,
}: {
  categories: Category[];
  accounts: Account[];
  rateCards: RateCard[];
  defaultTipe?: "income" | "expense";
  quick?: boolean;
  initial?: TxInitial;
}) {
  const router = useRouter();
  const isEdit = !!initial;
  const [tipe, setTipe] = useState<"income" | "expense">(initial?.tipe ?? (quick ? "expense" : defaultTipe));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const incomeCats = categories.filter((c) => c.tipe === "income");
  const expenseCats = categories.filter((c) => c.tipe === "expense");

  const [form, setForm] = useState<Record<string, string>>({
    tanggal: initial?.tanggal ?? today,
    categoryId: initial?.categoryId ?? "",
    accountId: initial?.accountId ?? accounts[0]?.id ?? "",
    jumlah: initial?.jumlah ?? "",
    catatan: initial?.catatan ?? "",
    rateCode: initial?.rateCode ?? "",
    jam: initial?.jam ?? "",
    durasi: initial?.durasi ?? "1",
    tanggalMain: today,
    namaEntitas: initial?.namaEntitas ?? "",
    noHp: initial?.noHp ?? "",
    dp: "",
    pelunasan: "",
    statusBayar: initial?.statusBayar ?? "lunas",
    tempatBeli: initial?.tempatBeli ?? "",
  });

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onRateChange(kode: string) {
    const rc = rateCards.find((r) => r.kode === kode);
    setForm((f) => ({
      ...f,
      rateCode: kode,
      jumlah: rc ? String(rc.harga) : f.jumlah,
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/transactions/${initial!.id}` : "/api/transactions", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tipe }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: data.error || "Gagal menyimpan" });
      } else if (isEdit) {
        setMsg({ type: "ok", text: "Perubahan tersimpan ✓" });
        router.push("/transaksi/riwayat");
        router.refresh();
      } else {
        setMsg({ type: "ok", text: "Transaksi tersimpan ✓" });
        setForm((f) => ({ ...f, jumlah: "", catatan: "", namaEntitas: "", noHp: "", dp: "", pelunasan: "", rateCode: "", tempatBeli: "" }));
        router.refresh();
      }
    } catch {
      setMsg({ type: "err", text: "Kesalahan jaringan" });
    }
    setSaving(false);
  }

  const cats = tipe === "income" ? incomeCats : expenseCats;

  return (
    <form onSubmit={submit} className="card max-w-2xl space-y-4">
      {/* Tab tipe */}
      <div className="flex rounded-lg bg-ink-800 p-1 text-sm">
        <button type="button" disabled={isEdit} onClick={() => setTipe("income")}
          className={`flex-1 py-2 rounded-md disabled:opacity-60 ${tipe === "income" ? "bg-brand-green text-black font-medium" : "text-slate-400"}`}>
          Pemasukan
        </button>
        <button type="button" disabled={isEdit} onClick={() => setTipe("expense")}
          className={`flex-1 py-2 rounded-md disabled:opacity-60 ${tipe === "expense" ? "bg-brand-red text-white font-medium" : "text-slate-400"}`}>
          Pengeluaran
        </button>
      </div>

      {msg && (
        <div className={`rounded-lg text-sm px-3 py-2 border ${msg.type === "ok" ? "bg-brand-green/10 border-brand-green/30 text-brand-green" : "bg-brand-red/10 border-brand-red/30 text-brand-red"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Tanggal</label>
          <input type="date" className="input" value={form.tanggal} onChange={(e) => set("tanggal", e.target.value)} required />
        </div>
        <div>
          <label className="label">Kategori</label>
          <select className="input" value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} required>
            <option value="">— pilih kategori —</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
          </select>
        </div>
      </div>

      {tipe === "income" && !quick && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Kode Tarif</label>
              <select className="input" value={form.rateCode} onChange={(e) => onRateChange(e.target.value)}>
                <option value="">— manual —</option>
                {rateCards.map((r) => <option key={r.id} value={r.kode}>{r.kode} · {r.nama}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Jam</label>
              <input className="input" placeholder="18:00-20:00" value={form.jam} onChange={(e) => set("jam", e.target.value)} />
            </div>
            <div>
              <label className="label">Durasi (jam)</label>
              <input type="number" min="0" className="input" value={form.durasi} onChange={(e) => set("durasi", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Nama Entitas / Penyewa</label>
              <input className="input" value={form.namaEntitas} onChange={(e) => set("namaEntitas", e.target.value)} />
            </div>
            <div>
              <label className="label">No. HP (wa.me/...)</label>
              <input className="input" value={form.noHp} onChange={(e) => set("noHp", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Tanggal Main</label>
              <input type="date" className="input" value={form.tanggalMain} onChange={(e) => set("tanggalMain", e.target.value)} />
            </div>
            <div>
              <label className="label">DP</label>
              <input type="number" className="input" value={form.dp} onChange={(e) => set("dp", e.target.value)} />
            </div>
            <div>
              <label className="label">Status Bayar</label>
              <select className="input" value={form.statusBayar} onChange={(e) => set("statusBayar", e.target.value)}>
                <option value="lunas">Lunas</option>
                <option value="dp">DP</option>
              </select>
            </div>
          </div>
        </>
      )}

      {tipe === "expense" && (
        <div>
          <label className="label">Tempat Beli</label>
          <input className="input" value={form.tempatBeli} onChange={(e) => set("tempatBeli", e.target.value)} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Jumlah (Rp)</label>
          <input type="number" className="input" value={form.jumlah} onChange={(e) => set("jumlah", e.target.value)} required />
        </div>
        <div>
          <label className="label">Rekening</label>
          <select className="input" value={form.accountId} onChange={(e) => set("accountId", e.target.value)} required>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Catatan</label>
        <textarea className="input min-h-[60px]" value={form.catatan} onChange={(e) => set("catatan", e.target.value)} />
      </div>

      <button className={tipe === "income" ? "btn-primary w-full" : "btn w-full bg-brand-red text-white hover:bg-red-600"} disabled={saving}>
        {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : `Simpan ${tipe === "income" ? "Pemasukan" : "Pengeluaran"}`}
      </button>
    </form>
  );
}
