import { createHash } from "node:crypto";
import type { ParsedRow } from "./v3bks-import";
export const normalize = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
export function fingerprint(row: ParsedRow) {
  return createHash("sha256").update(JSON.stringify([
    row.tanggal, row.tipe, normalize(row.kategori), row.jumlah, normalize(row.akun),
    normalize(row.entitas || ""), normalize(row.kode || ""), normalize(row.jam || ""),
    row.statusBayar || "", normalize(row.catatan || ""),
  ])).digest("hex");
}
export function fileHash(csv: string) {
  return createHash("sha256").update(csv.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim()).digest("hex");
}
export function possibleCorrection(row: ParsedRow, previous: ParsedRow) {
  return row.tanggal === previous.tanggal && row.tipe === previous.tipe &&
    normalize(row.kategori) === normalize(previous.kategori) &&
    (row.tipe === "expense" || normalize(row.entitas || "") === normalize(previous.entitas || ""));
}
