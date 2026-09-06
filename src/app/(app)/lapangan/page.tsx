import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
export const dynamic="force-dynamic";
export default async function Lapangan() {
 const user=await getSession(); if(!user) redirect("/login");
 const [pending,fixes]=await Promise.all([prisma.importBatch.count({where:{uploadedById:user.id,status:"submitted"}}),prisma.importBatch.count({where:{uploadedById:user.id,status:"needs_fix"}})]);
 return <div className="max-w-3xl mx-auto space-y-6"><section className="rounded-3xl bg-gradient-to-br from-brand-green/20 to-ink-900 p-6 border border-brand-green/20"><p className="text-brand-green tracking-widest uppercase text-xs">V3BKS · Operasional lapangan</p><h2 className="text-3xl font-bold mt-3">Halo, {user.nama.split(" ")[0]}</h2><p className="text-slate-400 mt-2">Catat di tracker, unggah untuk pemeriksaan, lalu selesaikan penghitungan kas.</p><Link className="btn-primary inline-flex mt-5 min-h-12 items-center" href="/transaksi/impor">Unggah tracker hari ini →</Link></section><div className="grid grid-cols-2 gap-3"><div className="card"><b className="text-3xl">{pending}</b><p className="text-sm text-slate-400">Menunggu finance</p></div><div className="card"><b className="text-3xl text-brand-amber">{fixes}</b><p className="text-sm text-slate-400">Perlu diperbaiki</p></div></div><div className="grid sm:grid-cols-2 gap-3">{[["/pembayaran","Pembayaran pelanggan","Periksa DP dan pelunasan"],["/operasional","Bukti & koreksi","Lampirkan bukti dan ajukan pemeriksaan"],["/tutup-kas","Tutup kas","Hitung uang fisik akhir shift"],["/transaksi/impor","Riwayat tracker","Pantau hasil persetujuan"]].map(([href,title,sub])=><Link key={href} href={href} className="card block min-h-28 hover:border-brand-green/40"><h3 className="font-semibold text-lg">{title} →</h3><p className="text-sm text-slate-400 mt-2">{sub}</p></Link>)}</div></div>;
}
