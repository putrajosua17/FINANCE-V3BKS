/**
 * Seed master akuntansi (idempotent): Unit Bisnis, Chart of Accounts,
 * dan pemetaan Rekening/Kategori -> COA. Dipakai oleh seed.ts, seed-prod.ts,
 * dan skrip backfill. Aman dijalankan berkali-kali.
 */
import type { PrismaClient } from "@prisma/client";
import { COA, ACCOUNT_COA_MAP, coaForCategory } from "@/lib/coa";

export const BUSINESS_UNITS = [
  { kode: "V3BKS-MS", nama: "Mini Soccer V3BKS", induk: "V3BKS", tipe: "lapangan", urutan: 1 },
  { kode: "V3BKS-CAFE", nama: "Cafe V3BKS", induk: "V3BKS", tipe: "cafe", urutan: 2 },
  { kode: "HSC-BAD", nama: "Badminton HSC", induk: "HSC", tipe: "lapangan", urutan: 3 },
  { kode: "HSC-PADEL", nama: "Padel HSC", induk: "HSC", tipe: "lapangan", urutan: 4 },
  { kode: "HSC-HYROX", nama: "Hyrox HSC", induk: "HSC", tipe: "kelas", urutan: 5 },
  { kode: "HSC-CAFE", nama: "HS Cafe & Resto", induk: "HSC", tipe: "cafe", urutan: 6 },
];

export const DEFAULT_BU_KODE = "V3BKS-MS";

export async function seedAccountingMasters(prisma: PrismaClient): Promise<void> {
  // ---- Unit Bisnis (F-07) ----
  for (const bu of BUSINESS_UNITS) {
    await prisma.businessUnit.upsert({
      where: { kode: bu.kode },
      update: { nama: bu.nama, induk: bu.induk, tipe: bu.tipe, urutan: bu.urutan },
      create: bu,
    });
  }

  // ---- Chart of Accounts (F-01) — dua tahap agar parentId terpetakan ----
  for (const c of COA) {
    await prisma.chartOfAccount.upsert({
      where: { kode: c.kode },
      update: { nama: c.nama, tipe: c.tipe, subTipe: c.subTipe ?? null, saldoNormal: c.saldoNormal },
      create: { kode: c.kode, nama: c.nama, tipe: c.tipe, subTipe: c.subTipe ?? null, saldoNormal: c.saldoNormal },
    });
  }
  const coaRows = await prisma.chartOfAccount.findMany({ select: { id: true, kode: true } });
  const coaId = new Map(coaRows.map((r) => [r.kode, r.id]));
  for (const c of COA) {
    if (!c.parent) continue;
    const pid = coaId.get(c.parent);
    if (pid) await prisma.chartOfAccount.update({ where: { kode: c.kode }, data: { parentId: pid } });
  }

  // ---- Pemetaan Rekening -> COA kas/bank ----
  const accounts = await prisma.account.findMany();
  for (const a of accounts) {
    const kode = ACCOUNT_COA_MAP[a.nama] ?? "1-1100";
    const id = coaId.get(kode);
    if (id && a.coaId !== id) await prisma.account.update({ where: { id: a.id }, data: { coaId: id } });
  }

  // ---- Pemetaan Kategori -> COA pendapatan/beban ----
  const categories = await prisma.category.findMany();
  for (const c of categories) {
    const kode = coaForCategory(c.nama, c.tipe);
    const id = coaId.get(kode);
    if (id && c.coaId !== id) await prisma.category.update({ where: { id: c.id }, data: { coaId: id } });
  }
}
