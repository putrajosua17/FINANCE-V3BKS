// -----------------------------------------------------------------------------
// F-05 · Kunci Periode — penegakan di level API
// -----------------------------------------------------------------------------
import type { Db } from "@/lib/journal";

/** Ubah tanggal menjadi kode periode "YYYY-MM". */
export function periodeOf(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Error khusus periode terkunci → dipetakan ke HTTP 423 oleh route. */
export class PeriodLockedError extends Error {
  status = 423;
  constructor(public periode: string) {
    super(`Periode ${periode} telah dikunci. Transaksi tidak dapat dibuat, diubah, atau dihapus.`);
    this.name = "PeriodLockedError";
  }
}

/**
 * Lempar PeriodLockedError bila periode dari `tanggal` terkunci.
 * Kunci global (businessUnitId null) berlaku untuk semua unit; kunci per-unit
 * hanya berlaku untuk unit tersebut.
 */
export async function assertPeriodOpen(
  db: Db,
  tanggal: Date | string,
  businessUnitId?: string | null
): Promise<void> {
  const periode = periodeOf(tanggal);
  const locks = await db.periodLock.findMany({
    where: {
      periode,
      status: { in: ["terkunci", "final"] },
      OR: [{ businessUnitId: null }, ...(businessUnitId ? [{ businessUnitId }] : [])],
    },
    select: { id: true },
  });
  if (locks.length > 0) throw new PeriodLockedError(periode);
}

/** Cek non-throwing — untuk UI/laporan. */
export async function isPeriodLocked(
  db: Db,
  periode: string,
  businessUnitId?: string | null
): Promise<boolean> {
  const lock = await db.periodLock.findFirst({
    where: {
      periode,
      status: { in: ["terkunci", "final"] },
      OR: [{ businessUnitId: null }, ...(businessUnitId ? [{ businessUnitId }] : [])],
    },
    select: { id: true },
  });
  return !!lock;
}
