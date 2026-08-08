# PRD — V3BKS FinanceFlow

**Aplikasi Dashboard Keuangan untuk Bisnis Rental Mini Soccer V3BKS**

| | |
|---|---|
| **Nama Produk** | V3BKS FinanceFlow (ULTIMATE OS) |
| **Versi Dokumen** | 1.0 |
| **Tanggal** | 8 Agustus 2026 |
| **Pemilik** | V3BKS Mini Soccer |
| **Status** | Disetujui — pembangunan dimulai (web penuh, multi-user, data mulai Agustus 2026) |
| **Sumber Referensi** | Mockup dashboard "FinanceFlow" + data `2026_V3BKS_Mini_Soccer_Revenue_&_Expenses_Tracker.pdf` |

---

## 1. Ringkasan Eksekutif

V3BKS FinanceFlow adalah aplikasi web dashboard keuangan **khusus untuk bisnis rental lapangan mini soccer**. Aplikasi ini menggantikan pencatatan berbasis spreadsheet (seperti file Excel/PDF yang ada sekarang) menjadi sebuah aplikasi terpusat, real-time, dan mudah dibaca.

Tampilan dan pengalaman pengguna (UX) mengikuti mockup **FinanceFlow** (tema gelap, sidebar kiri, kartu KPI di atas, grid widget analitik), namun seluruh **modul, istilah, dan logika bisnis disesuaikan** dengan operasi rental mini soccer: booking lapangan per kode & jam, DP/pelunasan, jasa tambahan (fotografer, wasit, rompi, recording, video), multi-rekening (Cash/BCA/Mandiri/BNI), target harian & bulanan, serta pajak (PPh Final 0,5% & Pajak Daerah 10%).

**Tujuan utama:** satu layar untuk menjawab "Berapa pemasukan, pengeluaran, dan laba hari/bulan ini? Sudah tercapai berapa % dari target? Berapa saldo tiap rekening? Tagihan rutin apa yang akan jatuh tempo? Pelunasan mana yang masih outstanding?"

---

## 2. Latar Belakang & Masalah

Saat ini pencatatan keuangan V3BKS dilakukan di spreadsheet dengan banyak sheet terpisah:

- **Rekap tahunan** (Income/Expenses/Profit per bulan, pajak).
- **Kategori Income & Expenses** (breakdown per kategori per bulan).
- **Settlement Details** harian (rental sales, pajak 10%, jasa, target harian/bulanan).
- **Detail transaksi** income (DP, pelunasan, entitas, no. HP, jam main) & expenses (kategori, tempat beli, catatan).
- **Rekap metode pembayaran** harian (Cash/BCA/Mandiri/BNI).
- **Analisa jam main** (jumlah booking 1–4 jam per bulan).

Masalah yang muncul:

1. **Tersebar & manual** — data harus dijumlah manual antar-sheet; rawan `#N/A`, sel kosong, dan salah rumus.
2. **Tidak real-time** — pemilik tidak bisa melihat kondisi hari ini tanpa membuka & menghitung ulang.
3. **Sulit memantau target** — target harian Rp6.000.000 & target bulanan tidak terpantau otomatis.
4. **Pelunasan/DP tidak terkontrol** — banyak "SISA PELUNASAN" yang harus ditagih; mudah terlewat.
5. **Tidak ada peringatan tagihan rutin** — gaji, listrik, cleaning service, wifi, pajak dibayar rutin tapi tanpa reminder.
6. **Tidak ramah dibaca** — pemilik ingin tampilan visual seperti mockup FinanceFlow, bukan tabel spreadsheet.

---

## 3. Tujuan & Metrik Keberhasilan

### 3.1 Tujuan Produk
- **T1** — Menyediakan dashboard ringkas berisi KPI keuangan yang selalu update.
- **T2** — Mempermudah input transaksi income (booking + jasa) & expenses harian.
- **T3** — Memantau realisasi target harian & bulanan secara otomatis.
- **T4** — Mengelola saldo multi-rekening (Cash/BCA/Mandiri/BNI).
- **T5** — Melacak DP & pelunasan (piutang) yang belum lunas.
- **T6** — Mengingatkan tagihan rutin (gaji, listrik, cleaning, wifi, pajak).
- **T7** — Menghasilkan laporan bulanan & tahunan (P&L, pajak, kategori) sekali klik.

### 3.2 Metrik Keberhasilan
- Waktu input satu transaksi booking < 30 detik.
- 100% transaksi harian tercatat di aplikasi (menggantikan spreadsheet).
- Selisih saldo rekening aplikasi vs aktual = 0 (setelah rekonsiliasi harian).
- Pemilik dapat melihat status target hari ini dalam < 5 detik setelah buka dashboard.
- Laporan bulanan siap diekspor (PDF/Excel) tanpa perhitungan manual.

---

## 4. Persona & Peran Pengguna

| Peran | Deskripsi | Kebutuhan Utama |
|---|---|---|
| **Owner** | Pemilik V3BKS | Lihat dashboard, laba/target, laporan, semua akses |
| **Kasir / Admin Operasional** | Staf yang mencatat booking & pembayaran harian | Input transaksi cepat, catat DP/pelunasan, tutup kas harian |
| **Finance / Akuntan** | Menyiapkan laporan & pajak | Rekap kategori, pajak, ekspor laporan |

> Keputusan: aplikasi **multi-user** dengan login & role (Owner/Admin/Finance) sejak awal.

---

## 5. Ruang Lingkup

### 5.1 In-Scope (MVP → V1)
- Dashboard KPI + widget analitik (sesuai mockup).
- Modul Tambah Transaksi (Income & Expenses) dengan field lengkap sesuai PDF.
- Riwayat Transaksi (filter, cari, edit, hapus).
- Daftar Akun / Rekening (Cash, BCA, Mandiri, BNI) + saldo.
- Target & Tagihan (target harian/bulanan + tagihan rutin + pelunasan outstanding).
- Booking & Jadwal (menggantikan "Portfolio Investasi" — daftar booking per kode/jam/tanggal main).
- Laporan Keuangan (P&L bulanan/tahunan, kategori, pajak, metode bayar).
- Budgeting & Prediksi (target vs realisasi, proyeksi sederhana).
- FlowAI Insight (insight otomatis berbasis rule).
- Panduan & Pengaturan (master data tarif, kategori, pajak).

### 5.2 Out-of-Scope (untuk sekarang)
- Integrasi payment gateway / mutasi bank otomatis.
- Aplikasi mobile native (web responsive dulu).
- Prediksi berbasis machine learning kompleks (cukup rule/tren linier).
- Multi-cabang (aplikasi difokuskan untuk 1 lokasi V3BKS).
- Modul investasi/portofolio saham (diganti Booking & Jadwal).

---

## 6. Master Data (dari PDF)

### 6.1 Tarif Rental & Jasa (Rental Code)

**Rental Lapangan (per slot, harga include tax)**

| Kode | Waktu | Hari | Harga |
|---|---|---|---|
| WD1 | 07.00–16.00 | Weekday | Rp600.000 |
| WD2 | 16.00–18.00 | Weekday | Rp800.000 |
| WD3 | 18.00–23.00 | Weekday | Rp960.000 |
| WE1 | 07.00–16.00 | Weekend | Rp720.000 |
| WE2 | 16.00–18.00 | Weekend | Rp960.000 |
| WE3 | 18.00–23.00 | Weekend | Rp1.040.000 |

**Paket Membership (final — menggantikan tarif member lama)**

| Paket | Berlaku | Harga |
|---|---|---|
| **Member Weekday** | Senin–Jumat | **Rp3.000.000** |
| **Member Weekend** | Sabtu & Minggu | **Rp3.500.000** |

> Catatan: tarif member per-slot lama (WDM/WEM +10%) **sudah tidak dipakai** dan dihapus dari master data. Membership kini berupa paket flat: Weekday Rp3.000.000 & Weekend Rp3.500.000.

**Jasa Tambahan**

| Kategori | Kode | Durasi | Harga |
|---|---|---|---|
| Wasit | WASIT1–4 | 1/2/3/4 jam | Rp200.000 / Rp350.000 / Rp450.000 / Rp650.000 |
| Photographer | PG1–4 | 1/2/3/4 jam | Rp300.000 / Rp500.000 / Rp600.000 / Rp750.000 |
| Sewa Rompi | ROMPI1–2 | 1/2 set | Rp70.000 / Rp100.000 |
| Video/Recording | VD1–3 | 1/2/3 jam | Rp150.000 / Rp300.000 / Rp450.000 |
| New Member | — | — | Rp399.000 |

### 6.2 Kategori Pemasukan (Income)
Rental, Photographer, Wasit, Recording, New Member, Sewa Rompi, Fee Samkot 65%, Event/Turnamen/Poundfit, Pendapatan Lain-lain, Sponsor.

### 6.3 Kategori Pengeluaran (Expenses)
Gaji Karyawan, PT. LA JALI (Cleaning Service), Fee Photographer, Listrik, Air, Solar, Alat Kebersihan, Stock Bola, Maintenance, WiFi, Telkomsel, Other Expenses-1, Other Expenses-2, Football Academy, Fee Academy Samkot 35%, Marketing, Event/Turnamen/Poundfit, Pajak, Bonus/Insentif/THR Karyawan.

### 6.4 Rekening / Metode Pembayaran
Cash, BCA, Mandiri, BNI.

### 6.5 Parameter Pajak
- **PPh Final 0,5%** = 0,5% × omzet kotor (final, standar UMKM PP 23/2018).
- **Pajak Daerah 10%** dari rental sales.
- Field pajak per bulan dicatat & dijumlah otomatis.

### 6.6 Target
- **Target Harian:** Rp6.000.000 (default, dapat diubah).
- **Target Bulanan:** contoh Agustus Rp186.000.000 (dapat diubah per bulan).

---

## 7. Model Data (Skema)

Entitas inti (disederhanakan; tipe & relasi final saat implementasi):

**Account** — `id, nama (Cash/BCA/Mandiri/BNI), tipe, saldo_awal, saldo_berjalan, is_active`

**Category** — `id, nama, tipe (income|expense), is_recurring, is_active`

**RateCard (Master Tarif)** — `id, kode (WD1..), nama, kategori, hari (weekday|weekend), jam_mulai, jam_selesai, durasi, harga, is_member, is_active`

**Transaction** — `id, tanggal, tipe (income|expense), category_id, account_id, jumlah, catatan, created_by`
- Field income tambahan: `rate_code, jam, durasi, tanggal_main, nama_entitas, no_hp, dp, pelunasan, status_bayar (dp|lunas), pajak_10, nilai_setelah_pajak`
- Field expense tambahan: `tempat_beli`

**Booking** — `id, kode, tanggal_main, jam_mulai, jam_selesai, durasi, nama_entitas, no_hp, harga, dp, sisa_pelunasan, status (booked|dp|lunas|selesai|batal), account_id, catatan`

**Bill (Tagihan Rutin)** — `id, nama, category_id, nominal_estimasi, siklus (bulanan/…), tanggal_jatuh_tempo, status (pending|paid), account_id`

**Target** — `id, periode (harian|bulanan), tanggal/bulan, nilai_target, nilai_realisasi`

**MonthlySummary (turunan/materialized)** — `bulan, tahun, total_income, total_expense, profit, pph_final, pajak_daerah` (dihitung dari transaksi).

**Setting** — `key, value` (pajak %, target default, tema, dsb.)

**User** *(fase multi-user)* — `id, nama, email, role (owner|admin|finance)`

---

## 8. Peta Navigasi (Sidebar)

Mengikuti mockup, disesuaikan untuk bisnis rental:

| Mockup FinanceFlow | Modul V3BKS FinanceFlow |
|---|---|
| Dashboard | **Dashboard** |
| Tambah Transaksi | **Tambah Transaksi** (Income/Expense) |
| Riwayat Transaksi | **Riwayat Transaksi** |
| Daftar Akun | **Daftar Rekening** (Cash/BCA/Mandiri/BNI) |
| Target & Tagihan | **Target & Tagihan** |
| Portfolio Investasi | **Booking & Jadwal** *(adaptasi)* |
| Laporan Keuangan | **Laporan Keuangan** |
| Budgeting & Prediksi | **Budgeting & Prediksi** |
| FlowAI Config | **FlowAI Insight & Config** |
| Panduan | **Panduan** |
| Pengaturan | **Pengaturan** (master data) |

Header sidebar: logo **"V3BKS FinanceFlow"** + badge "PRO" + subjudul "ULTIMATE OS". Tombol **QUICK SPEND** di kanan atas + toggle periode **Bulan Lalu / Bulan Ini**.

---

## 9. Spesifikasi Modul

### 9.1 Dashboard
Layout: 6 kartu KPI di atas, lalu grid widget (mengikuti mockup).

**Kartu KPI (baris atas):**
| Kartu | Definisi / Rumus |
|---|---|
| **Total Saldo** | Σ saldo semua rekening (Cash+BCA+Mandiri+BNI) |
| **Pemasukan** | Total income periode terpilih (bulan ini) |
| **Pengeluaran** | Total expenses periode terpilih |
| **Rasio Laba** *(≈ "Rasio Tabungan")* | Profit ÷ Income × 100% |
| **Nilai Kekayaan** *(Net Worth)* | Akumulasi profit + saldo kas |
| **Status Keuangan** | Skor kesehatan (Healthy/Warning/Risk) berbasis rasio laba, target, & cashflow |

**Widget (grid):**
1. **Arus Kas (Bulan Ini)** — line/area chart income vs expense vs net per hari (dari Settlement Details harian).
2. **Rincian Pengeluaran** — donut chart breakdown expense per kategori + legend.
3. **Tagihan Mendatang** — daftar tagihan rutin & pelunasan outstanding terdekat (nama, nominal, jatuh tempo, "Bayar").
4. **Progres Target** — progress bar realisasi vs target (harian & bulanan) + persentase.
5. **FlowAI Insight** — 2–3 insight otomatis (mis. "Kategori Listrik pengeluaran terbesar 18,9%").
6. **Tren Bulanan** — bar/line income vs expense vs profit Jan–Des.
7. **Total Tagihan** — total nominal tagihan pending + jumlah item.
8. **Saldo Rekening** — saldo per rekening (Cash/BCA/Mandiri/BNI) + total.

Semua widget menghormati toggle **Bulan Lalu / Bulan Ini**.

### 9.2 Tambah Transaksi
Dua tab: **Pemasukan** dan **Pengeluaran**.

**Form Pemasukan (booking/jasa):**
- Tanggal transaksi, Kategori (Rental/Photographer/Wasit/…), Kode tarif (auto-isi harga dari RateCard), Jam & Durasi, Tanggal Main, Nama Entitas, No. HP (format `wa.me/…`), DP, Pelunasan, Jumlah total, Status bayar (DP/Lunas), Rekening tujuan, Catatan.
- Otomatis: hitung Pajak Daerah 10% & nilai setelah pajak.

**Form Pengeluaran:**
- Tanggal, Kategori (Gaji/Listrik/Cleaning/…), Jumlah, Tempat Beli, Rekening sumber, Catatan.

**Quick Spend:** modal cepat untuk expense kecil (kategori Other Expenses) — 3 field: nominal, kategori, catatan.

### 9.3 Riwayat Transaksi
- Tabel gabungan income & expense: tanggal, tipe, kategori, entitas/keterangan, rekening, jumlah, status.
- Filter: rentang tanggal, tipe, kategori, rekening, status bayar.
- Pencarian teks (nama entitas, catatan, no. HP).
- Aksi: lihat detail, edit, hapus (dengan konfirmasi), duplikat.
- Ekspor CSV/Excel.

### 9.4 Daftar Rekening
- Kartu per rekening: nama, saldo berjalan, mutasi masuk/keluar bulan ini.
- Rincian pembayaran harian per rekening (Cash/BCA/Mandiri/BNI) — mereplikasi sheet rekap metode bayar.
- Fitur rekonsiliasi: input saldo aktual, tampilkan selisih.

### 9.5 Target & Tagihan
- **Target:** set target harian (default Rp6.000.000) & bulanan; tampilkan realisasi & sisa menuju target.
- **Tagihan Rutin:** daftar tagihan berulang (Gaji, Listrik, PT LA JALI, WiFi, Telkomsel, Pajak) dengan estimasi nominal, jatuh tempo, status; tombol "Tandai Lunas" → otomatis membuat transaksi expense.
- **Pelunasan Outstanding (Piutang):** daftar booking dengan sisa pelunasan > 0 (nama, no. HP `wa.me`, tanggal main, sisa) + tombol "Tandai Lunas".

### 9.6 Booking & Jadwal *(adaptasi Portfolio)*
- Kalender / list booking per tanggal main.
- Status booking: Booked, DP, Lunas, Selesai, Batal.
- Deteksi bentrok slot (kode + jam + tanggal).
- Ringkasan pemakaian jam (analisa jam main 1–4 jam per bulan, seperti sheet PDF).

### 9.7 Laporan Keuangan
- **P&L Bulanan & Tahunan:** Income, Expenses, Profit per bulan (Jan–Des) + total tahun.
- **Breakdown Kategori:** income & expense per kategori per bulan.
- **Laporan Pajak:** PPh Final 0,5% & Pajak Daerah 10% per bulan + total.
- **Laporan Metode Bayar:** total per rekening.
- Ekspor **PDF & Excel**.

### 9.8 Budgeting & Prediksi
- Set budget per kategori pengeluaran; bandingkan vs realisasi (progress + alert overspend).
- Proyeksi income/profit akhir bulan berbasis run-rate harian (linier) & tren 3 bulan.
- Skenario sederhana (mis. "jika okupansi naik 10%").

### 9.9 FlowAI Insight & Config
- Insight otomatis berbasis rule: kategori pengeluaran terbesar, hari tersibuk, pencapaian target, piutang menumpuk, deviasi vs bulan lalu.
- Konfigurasi ambang batas (threshold) insight & preferensi tampilan.
- *(Opsional lanjutan: integrasi LLM untuk narasi insight — di luar MVP.)*

### 9.10 Panduan
- Panduan singkat penggunaan tiap modul, definisi istilah (DP, pelunasan, PPh Final, Pajak Daerah), FAQ.

### 9.11 Pengaturan
- Master data: RateCard (tarif), Kategori, Rekening, Parameter Pajak, Target default.
- Preferensi: tema (default gelap sesuai mockup), format mata uang (Rp), periode fiskal.
- Manajemen pengguna *(fase multi-user)*.
- Impor data awal dari Excel/CSV (seed dari spreadsheet lama).

---

## 10. Rumus & Logika Bisnis Utama

- **Total Income (bulan)** = Σ transaksi income bulan tsb.
- **Total Expense (bulan)** = Σ transaksi expense bulan tsb.
- **Profit** = Income − Expenses.
- **Pajak Daerah 10%** = 10% × Rental Sales.
- **RENT after Tax** = Rental Sales − Pajak Daerah 10%.
- **PPh Final 0,5%** = 0,5% × dasar pengenaan (sesuai kebijakan; dikonfirmasi Owner).
- **Rasio Laba** = Profit ÷ Income.
- **Realisasi Target Harian** = Σ Total Sales hari tsb ÷ Target Harian.
- **Realisasi Target Bulanan** = Σ Total Sales bulan tsb ÷ Target Bulanan.
- **Sisa Pelunasan (piutang)** = Harga − DP (untuk booking belum lunas).
- **Saldo Rekening** = Saldo awal + Σ income ke rekening − Σ expense dari rekening.
- **Status Keuangan** = fungsi (Rasio Laba, % target tercapai, arah cashflow) → Healthy / Warning / Risk.

> Catatan: pada data Agustus 2026 sebagian bulan belum lengkap (baru ±8 hari). Aplikasi harus menangani bulan berjalan (partial month) & sel kosong tanpa error.

---

## 11. Kebutuhan Non-Fungsional

- **Tampilan:** tema gelap sesuai mockup; responsif (desktop utama, tablet/mobile menyusul); format Rupiah `Rp#.###.###`.
- **Bahasa:** Indonesia (default).
- **Performa:** dashboard load < 2 dtk untuk data 1 tahun.
- **Keandalan:** validasi input, konfirmasi hapus, tidak crash pada data kosong/`#N/A`.
- **Keamanan:** autentikasi login; data finansial tidak dipublikasikan; backup berkala.
- **Auditability:** jejak siapa membuat/mengubah transaksi (fase multi-user).
- **Ekspor:** PDF & Excel untuk laporan.
- **Offline-friendly (opsional):** cache ringan untuk baca dashboard.

---

## 12. Rekomendasi Arsitektur & Teknologi

> **Keputusan: web penuh (server + database).**

- **Frontend:** Next.js (App Router, React) + TypeScript + Tailwind CSS + **Recharts** untuk grafik. Tema gelap sesuai mockup.
- **Backend/API:** Next.js Route Handlers (REST) — satu codebase.
- **Database:** **PostgreSQL** (produksi) via **Prisma ORM**. Untuk pengembangan lokal digunakan SQLite (provider Prisma) agar cepat dijalankan; skema identik & mudah dipindah ke Postgres (ganti `provider` + `DATABASE_URL`).
- **Auth:** login email + password (hash bcrypt), session cookie, **multi-user role** (Owner/Admin/Finance).
- **Ekspor:** PDF & Excel (`exceljs`) — Fase 3.
- **Deploy:** Vercel / VPS + Postgres (Neon/Supabase/self-host).
- **Seed data:** skrip seeding master data (RateCard, Kategori, Rekening, Pajak, Target) + user awal, mulai periode Agustus 2026.

---

## 13. Rencana Rilis (Fase)

**Fase 0 — Fondasi**
- Setup proyek, tema gelap, layout sidebar + header, routing 11 menu, master data (RateCard, Kategori, Rekening, Pajak, Target), skema DB, seed data dari PDF.

**Fase 1 — MVP (inti)**
- Tambah Transaksi (Income/Expense) + Quick Spend.
- Riwayat Transaksi (filter/cari/edit/hapus).
- Daftar Rekening + saldo.
- Dashboard: 6 KPI + widget Arus Kas, Rincian Pengeluaran, Saldo Rekening, Tren Bulanan.

**Fase 2 — Target, Tagihan & Booking**
- Target & Tagihan (target harian/bulanan, tagihan rutin, pelunasan outstanding).
- Booking & Jadwal + deteksi bentrok + analisa jam main.
- Widget Progres Target, Tagihan Mendatang, Total Tagihan.

**Fase 3 — Laporan, Budgeting & Insight** ✅
- Laporan Keuangan (P&L, kategori, pajak) + ekspor **Excel (.xlsx)** & **Cetak/PDF**.
- Budgeting & Prediksi: anggaran per kategori (editable) + alert over-budget + proyeksi run-rate.
- FlowAI Insight (rule-based) + Panduan + Pengaturan.

**Fase 4 — Penyempurnaan (opsional)**
- Multi-user/RBAC, audit log, mobile polish, narasi insight LLM, backup otomatis.

---

## 14. Data Awal untuk Seeding (dari PDF)

**Rekap Bulanan 2026 (Rp)**

| Bulan | Income | Expenses | Profit |
|---|---:|---:|---:|
| Jan | 101.532.500 | 78.966.835 | 22.565.665 |
| Feb | 104.792.000 | 81.894.098 | 22.897.902 |
| Mar | 66.302.000 | 73.306.742 | −7.004.742 |
| Apr | 112.175.000 | 83.934.014 | 28.240.986 |
| Mei | 79.804.200 | 82.364.992 | −2.560.792 |
| Jun | 96.068.600 | 79.401.034 | 16.667.566 |
| Jul | 67.984.860 | 67.129.424 | 855.436 |
| Ags* | 28.249.540 | 795.200 | 27.454.340 |
| **Total** | **656.908.700** | **547.792.339** | **109.116.361** |

\*Agustus = bulan berjalan (data ±8 hari pertama).

**Total per Kategori Income (Rp):** Rental 555.508.700 · Photographer 93.800.000 · Wasit 6.350.000 · Sewa Rompi 1.250.000 · Fee Samkot 65% 10.227.600.

**Total per Kategori Expense (Rp):** Gaji Karyawan 242.183.548 · Listrik 103.202.881 · Fee Photographer 73.800.000 · PT LA JALI (Cleaning) 33.600.000 · Pajak 36.720.008 · Other Exp-1 18.736.900 · Other Exp-2 12.197.620 · WiFi 7.817.350 · Maintenance 4.174.500 · Alat Kebersihan 3.713.200 · Stock Bola 3.700.000 · Air 3.502.500 · Marketing 2.691.130 · Solar 900.000 · Telkomsel 852.702.

**Rekening:** Cash, BCA, Mandiri, BNI.
**Target:** Harian Rp6.000.000 · Bulanan (Agustus) Rp186.000.000.

> Detail transaksi harian Agustus (booking, DP/pelunasan, entitas, no. HP, jam main) & rekap metode bayar harian tersedia di PDF dan akan diimpor sebagai contoh data.

---

## 15. Keputusan Owner (terkonfirmasi)

1. ✅ **PPh Final 0,5%** = 0,5% × omzet kotor (final).
2. ✅ **Tarif member lama (WDM/WEM) dihapus.** Membership = paket flat: **Weekday Rp3.000.000**, **Weekend (Sabtu & Minggu) Rp3.500.000**.
3. ✅ **Multi-user** dengan role (Owner/Admin/Finance) sejak awal.
4. ⏳ **Fee Samkot 65% / Fee Academy 35%** — dicatat sebagai kategori tersendiri; perlakuan bagi hasil detail menyusul.
5. ✅ **Web penuh** (Next.js + database server).
6. ✅ **Data mulai Agustus 2026** (mulai relatif bersih; rekap bulan sebelumnya hanya sebagai referensi laporan, opsional).
7. ✅ **Ekspor laporan** — Excel (.xlsx) & Cetak/PDF sudah tersedia (Fase 3).

---

## 16. Kriteria Penerimaan (Acceptance) MVP

- [ ] Bisa menambah, mengedit, menghapus transaksi income & expense.
- [ ] Saldo tiap rekening akurat & konsisten dengan mutasi.
- [ ] Dashboard menampilkan 6 KPI benar sesuai rumus.
- [ ] Widget Arus Kas, Rincian Pengeluaran, Tren Bulanan, Saldo Rekening tampil dengan data nyata.
- [ ] Target harian/bulanan terhitung otomatis.
- [ ] Pelunasan outstanding & tagihan rutin tampil di Tagihan Mendatang.
- [ ] Laporan bulanan bisa diekspor.
- [ ] Tampilan gelap sesuai mockup & responsif di desktop.

---

*Dokumen ini adalah draft PRD. Mohon direview; setelah disetujui, pembangunan dimulai sesuai rencana fase pada Bagian 13.*
