import test from "node:test";
import assert from "node:assert/strict";
import { fingerprint,fileHash,possibleCorrection } from "./import-review";
import { canAccess } from "./access";
import { parseV3bksCsv,parseTanggal,type ParsedRow } from "./v3bks-import";
const row:ParsedRow={tanggal:"2026-09-01",tipe:"income",kategori:"Rental",jumlah:875000,akun:"Mandiri",entitas:"Tim Uji",statusBayar:"lunas"};
test("identity survives row reorder but detects economic corrections",()=>{assert.equal(fingerprint({...row,sourceRow:9}),fingerprint({...row,sourceRow:40}));assert.notEqual(fingerprint(row),fingerprint({...row,jumlah:900000}));assert.ok(possibleCorrection(row,{...row,jumlah:900000}));});
test("identical file handles BOM and line endings",()=>assert.equal(fileHash("\uFEFFa,b\r\n1,2\r\n"),fileHash("a,b\n1,2\n")));
test("cashier has no direct posting or approval bypass",()=>{for(const p of ["/api/transactions/import-v3bks","/api/transactions/import","/api/transactions","/api/accounts","/api/periode","/api/users","/laporan","/dashboard"])assert.equal(canAccess("admin",p,"POST"),false,p);assert.ok(canAccess("admin","/api/imports","POST"));assert.equal(canAccess("finance","/api/users","POST"),false);assert.ok(canAccess("owner","/api/users","POST"));});
test("invalid calendar dates are not normalized into another month",()=>{assert.equal(parseTanggal("31 September 2026"),null);assert.equal(parseTanggal("1 September 2026"),"2026-09-01");});
test("unknown payment account never defaults to cash",()=>{const r=Array(22).fill("");r[1]="1 September 2026";r[2]="Rental";r[11]="TRUE";r[12]="100000";r[13]="LUNAS";assert.equal(parseV3bksCsv(r.join(",")).rows[0].akun,"");});

 test("invalid paid rows produce explicit row errors",()=>{
  const row=Array(22).fill("");Object.assign(row,{1:"31 September 2026",2:"Rental",10:"TRUE",12:"100000",13:"TF BCA"});
  const parsed=parseV3bksCsv(row.join(","));assert.equal(parsed.rows.length,0);assert.match(parsed.errors[0],/Baris 1/);
 });
