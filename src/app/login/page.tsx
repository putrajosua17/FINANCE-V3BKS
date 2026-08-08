"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@v3bks.id");
  const [password, setPassword] = useState("owner123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal masuk");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 justify-center">
            <span className="text-2xl font-bold text-white">V3BKS</span>
            <span className="text-2xl font-bold text-brand-green">FinanceFlow</span>
            <span className="badge bg-brand-amber/20 text-brand-amber">PRO</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 tracking-widest uppercase">Ultimate OS · Mini Soccer</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <h1 className="text-lg font-semibold text-white">Masuk</h1>
          {error && (
            <div className="rounded-lg bg-brand-red/10 border border-brand-red/30 text-brand-red text-sm px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Memproses..." : "Masuk"}
          </button>
          <p className="text-[11px] text-slate-500 text-center">
            Demo: owner@v3bks.id / owner123 · admin@v3bks.id / admin123
          </p>
        </form>
      </div>
    </div>
  );
}
