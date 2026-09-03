// -----------------------------------------------------------------------------
// F-02 · Parser e-statement bank — arsitektur adapter
// -----------------------------------------------------------------------------
// Setiap bank punya format CSV/XLS berbeda. Parser dibangun sebagai adapter
// terpisah agar mudah ditambah/diperbaiki tanpa menyentuh logika rekonsiliasi.
// Mulai dari CSV; PDF menyusul. Selalu sediakan fallback pemetaan generik.

export type ParsedLine = {
  tanggal: Date;
  keterangan: string;
  debit: number; // uang keluar
  kredit: number; // uang masuk
  saldo?: number;
  refBank?: string;
};

export type ParseResult = {
  lines: ParsedLine[];
  totalBaris: number;
  terparse: number;
  bank: string;
};

export const SUPPORTED_BANKS = ["bca", "mandiri", "bni", "bri", "generic"] as const;
export type BankKode = (typeof SUPPORTED_BANKS)[number];

// ---- Utilitas CSV (tanpa dependensi) ----------------------------------------

function detectDelimiter(sample: string): string {
  const candidates = [";", "\t", ","];
  let best = ",";
  let bestCount = -1;
  for (const d of candidates) {
    const count = (sample.match(new RegExp(`\\${d === "\t" ? "t" : d}`, "g")) || []).length;
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  }
  return best;
}

function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === delim && !inQuotes) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

// Angka gaya Indonesia: "1.234.567,89" atau "1,234,567.89" atau "1234567".
export function parseAngka(raw: string): number {
  if (!raw) return 0;
  let s = raw.replace(/[^0-9.,-]/g, "").trim();
  if (!s) return 0;
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot >= 0 && lastComma >= 0) {
    // pemisah desimal = yang paling kanan
    if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (lastComma >= 0) {
    // hanya koma: anggap ribuan bila 3 digit setelahnya, else desimal
    const after = s.length - lastComma - 1;
    s = after === 3 ? s.replace(/,/g, "") : s.replace(",", ".");
  } else {
    // hanya titik: anggap ribuan bila 3 digit setelahnya
    const after = s.length - lastDot - 1;
    if (lastDot >= 0 && after === 3) s = s.replace(/\./g, "");
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

// Tanggal umum: dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd, dd MMM yyyy.
const BULAN_ID: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, may: 4, jun: 5, jul: 6, agu: 7, ags: 7, aug: 7,
  sep: 8, okt: 9, oct: 9, nov: 10, des: 11, dec: 11,
};

export function parseTanggal(raw: string): Date | null {
  const s = (raw || "").trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (m) {
    const yr = Number(m[3].length === 2 ? "20" + m[3] : m[3]);
    return new Date(yr, Number(m[2]) - 1, Number(m[1]), 12);
  }
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);
  if (m) {
    const bln = BULAN_ID[m[2].slice(0, 3).toLowerCase()];
    if (bln !== undefined) return new Date(Number(m[3]), bln, Number(m[1]), 12);
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ---- Pemetaan kolom generik ------------------------------------------------

function findCol(header: string[], keys: string[]): number {
  const norm = header.map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
  for (const k of keys) {
    const idx = norm.findIndex((h) => h.includes(k));
    if (idx >= 0) return idx;
  }
  return -1;
}

type MutationDirection = "debit" | "credit";

/**
 * Tentukan arah mutasi tanpa menebak dari tanda hubung pada deskripsi.
 *
 * Banyak deskripsi BCA mengandung `E-BANKING` atau `BI-FAST`; tanda `-`
 * tersebut bukan penanda uang keluar. Kolom DB/CR yang eksplisit selalu
 * diprioritaskan, lalu token DB/CR pada nominal/deskripsi, dan terakhir tanda
 * negatif pada nominal. Nilai positif tanpa penanda dianggap ambigu dan
 * dilewati agar rekonsiliasi tidak membalik arah transaksi.
 */
export function detectMutationDirection(
  directionRaw: string,
  amountRaw: string,
  descriptionRaw: string
): MutationDirection | null {
  const explicit = `${directionRaw} ${amountRaw}`.toUpperCase();
  if (/\b(?:DB|D|DEBET|DEBIT|DR)\b/.test(explicit)) return "debit";
  if (/\b(?:CR|C|KREDIT|CREDIT)\b/.test(explicit)) return "credit";

  const description = descriptionRaw.toUpperCase();
  // Pada narasi BCA, token pertama DB/CR setelah jenis transfer adalah arah
  // mutasi. Contoh incoming: "BI-FAST CR TRANSFER DR ..." — CR harus menang.
  const token = description.match(/\b(?:DB|CR|DEBET|DEBIT|KREDIT|CREDIT)\b/)?.[0];
  if (token === "DB" || token === "DEBET" || token === "DEBIT") return "debit";
  if (token === "CR" || token === "KREDIT" || token === "CREDIT") return "credit";

  if (/^\s*-/.test(amountRaw)) return "debit";
  if (/^\s*\+/.test(amountRaw)) return "credit";
  return null;
}

/**
 * Parser generik berbasis header. Mengenali kolom umum e-statement Indonesia:
 * tanggal, keterangan, debit/mutasi, kredit, saldo. Mendukung format satu-kolom
 * "mutasi" bertanda DB/CR maupun dua-kolom debit/kredit terpisah.
 */
export function parseGeneric(text: string): ParsedLine[] {
  const rawLines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (rawLines.length === 0) return [];
  const delim = detectDelimiter(rawLines.slice(0, 5).join("\n"));

  // Cari baris header (mengandung "tanggal"/"date")
  let headerIdx = rawLines.findIndex((l) => /tanggal|date|tgl/i.test(l));
  if (headerIdx < 0) headerIdx = 0;
  const header = splitCsvLine(rawLines[headerIdx], delim);

  const cTgl = findCol(header, ["tanggal", "date", "tgl"]);
  const cKet = findCol(header, ["keterangan", "description", "uraian", "berita", "remark", "narasi"]);
  const cDebit = findCol(header, ["debit", "debet", "keluar", "withdrawal"]);
  const cKredit = findCol(header, ["kredit", "credit", "masuk", "deposit"]);
  const cMutasi = findCol(header, ["mutasi", "amount", "jumlah", "nominal"]);
  const cDirection = findCol(header, ["dbcr", "debitcredit", "jenismutasi", "transactiontype"]);
  const cSaldo = findCol(header, ["saldo", "balance"]);
  const cRef = findCol(header, ["ref", "no", "id"]);

  const lines: ParsedLine[] = [];
  for (let i = headerIdx + 1; i < rawLines.length; i++) {
    const cols = splitCsvLine(rawLines[i], delim);
    if (cols.length < 2) continue;
    const tgl = parseTanggal(cols[cTgl] ?? cols[0] ?? "");
    if (!tgl) continue;

    let debit = cDebit >= 0 ? parseAngka(cols[cDebit] ?? "") : 0;
    let kredit = cKredit >= 0 ? parseAngka(cols[cKredit] ?? "") : 0;

    // Format satu-kolom mutasi bertanda DB/CR (mis. BCA)
    if (debit === 0 && kredit === 0 && cMutasi >= 0) {
      const amountRaw = cols[cMutasi] ?? "";
      const val = Math.abs(parseAngka(amountRaw));
      const description = cKet >= 0 ? cols[cKet] ?? "" : cols.join(" ");
      const direction = detectMutationDirection(cDirection >= 0 ? cols[cDirection] ?? "" : "", amountRaw, description);
      if (val > 0 && direction) {
        if (direction === "debit") debit = val;
        else kredit = val;
      }
    }

    if (debit === 0 && kredit === 0) continue;
    lines.push({
      tanggal: tgl,
      keterangan: (cKet >= 0 ? cols[cKet] : cols.filter((_, idx) => idx !== cTgl).join(" ")) || "-",
      debit,
      kredit,
      saldo: cSaldo >= 0 && /\d/.test(cols[cSaldo] ?? "") ? parseAngka(cols[cSaldo] ?? "") : undefined,
      refBank: cRef >= 0 ? cols[cRef] : undefined,
    });
  }
  return lines;
}

// Adapter per bank — saat ini mendelegasikan ke generik (header berbeda dikenali
// otomatis). Titik ekstensi bila suatu bank butuh penanganan khusus.
export function parseStatement(bank: BankKode, text: string): ParseResult {
  const totalBaris = text.split(/\r?\n/).filter((l) => l.trim().length > 0).length;
  const lines = parseGeneric(text);
  return { lines, totalBaris, terparse: lines.length, bank };
}
