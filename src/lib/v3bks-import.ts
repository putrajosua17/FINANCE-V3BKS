// Parser khusus untuk format ekspor spreadsheet asli V3BKS Mini Soccer.
// Membaca blok Income (kiri) & Expenses (kanan) yang berdampingan, mengabaikan
// baris judul/catatan/rumus & kolom kosong.

export type ParsedRow = {
  tanggal: string; // ISO yyyy-mm-dd
  tipe: "income" | "expense";
  kategori: string; // nama kategori mentah dari sheet
  jumlah: number;
  akun: string; // hasil inferensi dari catatan (Cash/BCA/Mandiri/BNI)
  entitas?: string;
  noHp?: string;
  kode?: string;
  jam?: string;
  durasi?: number;
  statusBayar?: "dp" | "lunas";
  catatan?: string;
};

export type ParseResult = {
  rows: ParsedRow[];
  totalIncome: number;
  totalExpense: number;
  skippedIncome: number;
};

// --- CSV parser (mendukung field ber-tanda kutip) ---
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let field = "", row: string[] = [], inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      rows.push(row); row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const BULAN: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, mei: 5, jun: 6, jul: 7,
  aug: 8, ags: 8, agu: 8, sep: 9, oct: 10, okt: 10, nov: 11, dec: 12, des: 12,
};

// Menerima "01-Aug-26", "1 August 2026", "8 Agustus 2026" (pemisah - atau spasi,
// nama bulan Inggris/Indonesia singkat maupun panjang, tahun 2 atau 4 digit).
export function parseTanggal(raw: string): string | null {
  const s = (raw || "").trim();
  const m = s.match(/^(\d{1,2})[\s-]+([A-Za-z]+)[\s-]+(\d{2,4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const mon = BULAN[m[2].slice(0, 3).toLowerCase()];
  let year = Number(m[3]);
  if (!mon || !day) return null;
  if (year < 100) year += 2000;
  return `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseRupiah(raw: string): number {
  const s = (raw || "").replace(/rp/i, "").replace(/[.\s]/g, "").replace(/,/g, "");
  const n = Number(s.replace(/[^0-9-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function inferAkun(note: string): string {
  const s = (note || "").toLowerCase();
  if (/\bbni\b/.test(s)) return "BNI";
  if (/mandiri/.test(s)) return "Mandiri";
  if (/bca/.test(s)) return "BCA";
  if (/pattycash|cash|tunai/.test(s)) return "Cash";
  return "Cash";
}

const isTrue = (v: string) => (v || "").trim().toUpperCase() === "TRUE";

export function parseV3bksCsv(text: string): ParseResult {
  const grid = parseCSV(text);
  const rows: ParsedRow[] = [];
  let totalIncome = 0, totalExpense = 0, skippedIncome = 0;

  for (const r of grid) {
    // ---- Blok INCOME (kolom 1..13) ----
    // 1:Tanggal 2:Category 3:Code 4:Jam 5:Durasi 6:TglMain 7:Nama 8:Entitas
    // 9:NoHP 10:DP 11:PELUNASAN 12:JUMLAH 13:CATATAN
    const tgl = parseTanggal(r[1] || "");
    const kategori = (r[2] || "").trim();
    const jumlah = parseRupiah(r[12] || "");
    if (tgl && kategori && jumlah > 0) {
      const dp = isTrue(r[10] || "");
      const pel = isTrue(r[11] || "");
      // Hanya hitung baris yang benar-benar ada pembayaran (DP atau pelunasan),
      // sesuai "Total Income" pada sheet. Baris booking belum bayar dilewati.
      if (dp || pel) {
        const nama = `${(r[7] || "").trim()} ${(r[8] || "").trim()}`.trim();
        const catatan = (r[13] || "").trim();
        rows.push({
          tanggal: tgl,
          tipe: "income",
          kategori,
          jumlah,
          akun: inferAkun(catatan),
          entitas: nama || undefined,
          noHp: (r[9] || "").trim() || undefined,
          kode: (r[3] || "").trim() || undefined,
          jam: (r[4] || "").trim() || undefined,
          durasi: r[5] ? Number(r[5]) || undefined : undefined,
          statusBayar: pel ? "lunas" : "dp",
          catatan: catatan || undefined,
        });
        totalIncome += jumlah;
      } else {
        skippedIncome++;
      }
    }

    // ---- Blok EXPENSE (kolom 17..21) ----
    // 17:Tanggal 18:Category 19:Jumlah 20:TempatBeli 21:Catatan
    const tglE = parseTanggal(r[17] || "");
    const katE = (r[18] || "").trim();
    const jumlahE = parseRupiah(r[19] || "");
    if (tglE && katE && jumlahE > 0) {
      const catatanE = (r[21] || "").trim();
      rows.push({
        tanggal: tglE,
        tipe: "expense",
        kategori: katE,
        jumlah: jumlahE,
        akun: inferAkun(catatanE),
        catatan: [(r[20] || "").trim(), catatanE].filter(Boolean).join(" · ") || undefined,
      });
      totalExpense += jumlahE;
    }
  }

  return { rows, totalIncome, totalExpense, skippedIncome };
}
