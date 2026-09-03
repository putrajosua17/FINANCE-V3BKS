import assert from "node:assert/strict";
import test from "node:test";
import { detectMutationDirection, parseAngka, parseGeneric } from "./index";

test("parseAngka membaca format rupiah dan desimal bank", () => {
  assert.equal(parseAngka("Rp1.234.567,89"), 1_234_567.89);
  assert.equal(parseAngka("1,234,567.89"), 1_234_567.89);
});

test("tanda hubung pada E-BANKING dan BI-FAST bukan penanda debit", () => {
  assert.equal(detectMutationDirection("", "1056000.00", "TRSF E-BANKING CR DP Kegocek"), "credit");
  assert.equal(detectMutationDirection("", "1937000.00", "BI-FAST CR TRANSFER DR 535 PUTRA"), "credit");
  assert.equal(detectMutationDirection("", "7050000.00", "BI-FAST DB TRANSFER KE DENI"), "debit");
});

test("kolom DB/CR eksplisit diprioritaskan", () => {
  const csv = [
    "Tanggal;Keterangan;Jumlah;DB/CR;Saldo",
    "01/08/2026;TRSF E-BANKING CR DP Kegocek;1.056.000,00;CR;31.224.746,33",
    "02/08/2026;TRSF E-BANKING DB PROFIT JULI;855.436,00;DB;30.369.310,33",
  ].join("\n");
  const lines = parseGeneric(csv);
  assert.equal(lines.length, 2);
  assert.deepEqual({ debit: lines[0].debit, kredit: lines[0].kredit }, { debit: 0, kredit: 1_056_000 });
  assert.deepEqual({ debit: lines[1].debit, kredit: lines[1].kredit }, { debit: 855_436, kredit: 0 });
});

test("mutasi satu kolom tanpa arah tidak ditebak", () => {
  const csv = ["Tanggal;Keterangan;Jumlah", "01/08/2026;Mutasi tanpa penanda;100000"].join("\n");
  assert.equal(parseGeneric(csv).length, 0);
});
