# MIGRATION — Fase 7 · Fondasi Akuntansi (PRD v2.0)

Dokumen langkah migrasi untuk **Fase 7**: mesin double-entry (F-01), lampiran
dimensi multi-unit (F-07), serta kunci periode + soft delete (F-05).

Migrasi ini **aditif & non-breaking** — semua kolom baru `nullable`, tidak ada
kolom lama yang diubah/dihapus. Data lama tetap utuh; aplikasi tetap berjalan
sebelum backfill dijalankan.

## Ringkasan perubahan skema

**Model baru:** `BusinessUnit`, `ChartOfAccount`, `JournalEntry`, `JournalLine`,
`PeriodLock`.

**Kolom baru pada model lama:**

| Model | Tambahan |
|---|---|
| `Transaction` | `businessUnitId`, `journalEntryId`, `deletedAt`, `deletedById` |
| `Account` | `coaId` |
| `Category` | `coaId` |
| `Budget` / `Target` | `businessUnitId` |
| `AuditLog` | `nilaiLama`, `nilaiBaru`, `ipAddress` |
| `User` | `lastLoginAt` |

## Urutan langkah (produksi)

> **BACKUP database sebelum langkah 2.** Uji dulu di salinan basis data.

1. **Terapkan migrasi skema** (otomatis saat deploy Vercel, atau manual):
   ```bash
   prisma migrate deploy
   ```
   Menjalankan `20260809000000_fase7_fondasi_akuntansi` — hanya menambah
   tabel/kolom baru.

2. **Backfill** (idempoten, aman diulang):
   ```bash
   npm run backfill:journal
   ```
   Skrip ini:
   - Seed **Unit Bisnis** (6 unit V3BKS + HSC) & **Chart of Accounts** (±58 akun SAK EMKM).
   - Memetakan `Account`/`Category` lama ke akun COA.
   - Mengisi `Transaction.businessUnitId = V3BKS-MS` untuk data lama.
   - Membentuk `JournalEntry` double-entry untuk setiap transaksi historis yang
     belum berjurnal.
   - Memvalidasi **Neraca Saldo seimbang** (Σ debit = Σ kredit); keluar dengan
     error bila tidak seimbang.

3. **Verifikasi**:
   - Buka **Laporan → Neraca Saldo** — pastikan status "Seimbang".
   - Bandingkan total P&L sebelum/sesudah: total pendapatan & beban di jurnal
     **identik** dengan laporan kas (dijamin oleh desain pemetaan).

## Catatan integritas

- `JournalEntry` bersifat **append-only**. Edit transaksi = jurnal lama dibalik
  (*reversing entry*) + jurnal baru; hapus transaksi = *soft delete* + reversing
  entry. Neraca Saldo tetap seimbang di semua kasus.
- Periode yang dikunci (**Tutup Buku**) menolak create/update/delete transaksi
  dengan **HTTP 423**. Hanya `owner` yang dapat membuka kembali (alasan wajib,
  tercatat di Log Aktivitas).
- Backfill & seed idempoten — menjalankan ulang tidak menduplikasi data.

## Rollback

Karena aditif, rollback cukup dengan mengabaikan fitur baru; data lama tidak
terpengaruh. Bila perlu menghapus tabel baru, lakukan manual di luar Prisma
(mis. `DROP TABLE "JournalLine", "JournalEntry", ...`) setelah backup.

---

# Fase 8 · Otomasi Pekerjaan Harian (F-02, F-03, F-06, F-10)

Migrasi `20260809010000_fase8_otomasi_harian` — **aditif & non-breaking**
(hanya menambah `Transaction.contactId` + tabel baru).

**Model baru:** `BankStatement`, `BankStatementLine` (F-02 rekonsiliasi),
`CashClosing` (F-03 tutup kas), `Contact` (F-06 vendor/pelanggan),
`PurchaseInvoice` (F-06 utang usaha).

**Langkah:** cukup `prisma migrate deploy`. Tidak ada backfill wajib — fitur
aktif begitu tabel tersedia. Master vendor & faktur diisi lewat UI
(menu **Vendor & Pelanggan** → **Utang Usaha**).

**Integrasi jurnal (memakai mesin Fase 7):**
- Tutup kas disetujui → selisih diposting ke `6-1900 Selisih Kas`.
- Faktur pembelian → Debit beban/persediaan, Kredit `2-1100 Utang Usaha`
  (+ `2-1330` bila ada potongan PPh 23). Pembayaran → Debit utang, Kredit kas.
- Semua tetap menjaga Neraca Saldo seimbang (terverifikasi).

**Template reminder AR (F-10):** opsional, simpan di `Setting` dengan kunci
`template_reminder_ar` (variabel `{nama}`, `{jumlah}`, `{tanggal_main}`,
`{sisa}`). Bila kosong, dipakai template bawaan.
