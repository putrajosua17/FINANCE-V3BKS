import assert from "node:assert/strict";
import test from "node:test";
import { parseV3bksCsv } from "./v3bks-import";

const SEPTEMBER_SAMPLE = `,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
,Tanggal,Category,Code,Jam,Durasi,Tanggal Main,Nama,Entitas,No. HP,DP,PELUNASAN,JUMLAH,CATATAN,,,,Tanggal,Category,Jumlah,Tempat Beli,Catatan
,1 September 2026,RENTAL,WD3,19.00 - 21.00,2,1 September 2026,Pelanggan,Tim Uji,kontak-uji,FALSE,TRUE,"Rp875,000",LUNAS (TF MANDIRI),,,,3 September 2026,OTHER EXPENSES - 1,"Rp90,300",ERAMART,TISSUE (CASH)
,2 September 2026,RENTAL,WD1,21.00 - 22.00,,10 September 2026,Pelanggan,Tim Uji,kontak-uji,TRUE,FALSE,"Rp600,000",SISA PELUNASAN 600.000 (TF BNI),,,,,
`;

test("membaca format tracker September 2026", () => {
  const result = parseV3bksCsv(SEPTEMBER_SAMPLE);
  assert.equal(result.rows.length, 3);
  assert.equal(result.totalIncome, 1_475_000);
  assert.equal(result.totalExpense, 90_300);
  assert.deepEqual(result.rows.map((row) => row.akun), ["Mandiri", "Cash", "BNI"]);
  assert.equal(result.rows[2].statusBayar, "dp");
});
