// -----------------------------------------------------------------------------
// F-07 · Utilitas Unit Bisnis
// -----------------------------------------------------------------------------
import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/journal";

export const DEFAULT_BU_KODE = "V3BKS-MS";

/** Daftar unit aktif, terurut untuk selector & laporan. */
export async function listBusinessUnits() {
  return prisma.businessUnit.findMany({ where: { isActive: true }, orderBy: { urutan: "asc" } });
}

/** Id unit default (V3BKS-MS) untuk data yang belum menentukan unit. */
export async function defaultBusinessUnitId(db: Db = prisma): Promise<string | null> {
  const bu = await db.businessUnit.findUnique({ where: { kode: DEFAULT_BU_KODE }, select: { id: true } });
  return bu?.id ?? null;
}
