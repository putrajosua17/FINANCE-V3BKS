// -----------------------------------------------------------------------------
// F-03 · Perhitungan saldo kas sistem untuk tutup kas harian
// -----------------------------------------------------------------------------
import type { Db } from "@/lib/journal";

/**
 * Saldo kas "seharusnya" untuk sebuah rekening hingga akhir tanggal `asOf`:
 * saldoAwal + Σ pemasukan − Σ pengeluaran (mengecualikan transaksi terhapus).
 */
export async function saldoSistemAkun(db: Db, accountId: string, asOf: Date): Promise<number> {
  const account = await db.account.findUnique({ where: { id: accountId }, select: { saldoAwal: true } });
  if (!account) return 0;
  const end = new Date(asOf);
  end.setHours(23, 59, 59, 999);

  const [masuk, keluar] = await Promise.all([
    db.transaction.aggregate({ _sum: { jumlah: true }, where: { accountId, tipe: "income", deletedAt: null, tanggal: { lte: end } } }),
    db.transaction.aggregate({ _sum: { jumlah: true }, where: { accountId, tipe: "expense", deletedAt: null, tanggal: { lte: end } } }),
  ]);
  return account.saldoAwal + (masuk._sum.jumlah ?? 0) - (keluar._sum.jumlah ?? 0);
}
