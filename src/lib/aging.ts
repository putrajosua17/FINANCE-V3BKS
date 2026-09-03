// -----------------------------------------------------------------------------
// F-06 / F-10 · Pengelompokan umur utang (AP) & piutang (AR)
// -----------------------------------------------------------------------------

export type AgingBucketKey = "belum" | "b1_30" | "b31_60" | "b61_90" | "b90plus";

export const AGING_LABELS: Record<AgingBucketKey, string> = {
  belum: "Belum jatuh tempo",
  b1_30: "1–30 hari",
  b31_60: "31–60 hari",
  b61_90: "61–90 hari",
  b90plus: "> 90 hari",
};

/** Umur (hari) & bucket dari sebuah tanggal jatuh tempo terhadap `ref` (default hari ini). */
export function agingOf(jatuhTempo: Date, ref: Date = new Date()): { hari: number; bucket: AgingBucketKey } {
  const hari = Math.floor((ref.getTime() - new Date(jatuhTempo).getTime()) / 86_400_000);
  let bucket: AgingBucketKey;
  if (hari <= 0) bucket = "belum";
  else if (hari <= 30) bucket = "b1_30";
  else if (hari <= 60) bucket = "b31_60";
  else if (hari <= 90) bucket = "b61_90";
  else bucket = "b90plus";
  return { hari, bucket };
}

export function emptyAging(): Record<AgingBucketKey, number> {
  return { belum: 0, b1_30: 0, b31_60: 0, b61_90: 0, b90plus: 0 };
}
