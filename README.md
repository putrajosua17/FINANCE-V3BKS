# V3BKS FinanceFlow

Dashboard keuangan **web penuh** untuk bisnis rental **V3BKS Mini Soccer** — tampilan bergaya "FinanceFlow" (tema gelap, sidebar, KPI, widget analitik), dengan modul & data yang disesuaikan untuk operasi rental lapangan (booking, DP/pelunasan, jasa, multi-rekening, target harian/bulanan, pajak).

📄 Spesifikasi lengkap ada di [`PRD.md`](./PRD.md).

## Teknologi
- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** (tema gelap) + **Recharts** (grafik)
- **Prisma ORM** — SQLite untuk dev, **PostgreSQL** untuk produksi
- **Auth multi-user** (login email+password, JWT cookie, role: owner/admin/finance)

## Fitur (MVP → Fase 2)
- **Dashboard** — 6 KPI (Total Saldo, Pemasukan, Pengeluaran, Rasio Laba, Nilai Kekayaan, Status) + widget: Arus Kas, Rincian Pengeluaran, Tagihan Mendatang, Progres Target, FlowAI Insight, Tren Bulanan, Total Tagihan, Saldo Rekening.
- **Tambah Transaksi** — pemasukan (booking/jasa, auto-isi harga dari kode tarif, pajak daerah 10% otomatis) & pengeluaran + Quick Spend.
- **Riwayat Transaksi** — cari, filter, hapus.
- **Impor Data** — impor transaksi massal dari CSV (paste atau unggah file) dengan pratinjau, validasi per-baris, template unduhan.
- **Daftar Rekening** — saldo & mutasi Cash/BCA/Mandiri/BNI.
- **Target & Tagihan** — target harian/bulanan, tandai tagihan rutin lunas, lunasi piutang penyewa.
- **Booking & Jadwal** — daftar booking + status + analisa jam main.
- **Laporan Keuangan** — laba rugi bulanan, kategori, estimasi pajak + **ekspor Excel (.xlsx)** & **Cetak/PDF**.
- **Budgeting & Prediksi** — proyeksi run-rate + **anggaran per kategori (editable)** & alert over-budget.
- **FlowAI Insight** — insight otomatis berbasis rule.
- **Panduan** & **Pengaturan** — **CRUD master data lengkap** (tarif, kategori, rekening), **manajemen pengguna** (role-gated owner/admin) & parameter aplikasi yang dapat diedit.
- **Log Aktivitas** — audit trail siapa membuat/menghapus/mengimpor/melunasi (owner/admin).

## Menjalankan (development)

```bash
# 1. Install dependency
npm install

# 2. Siapkan env
cp .env.example .env      # sesuaikan bila perlu

# 3. Buat database + isi data awal (Agustus 2026)
npx prisma db push
npm run seed

# 4. Jalankan
npm run dev               # http://localhost:3000
```

**Login demo:**
| Role | Email | Password |
|---|---|---|
| Owner | `owner@v3bks.id` | `owner123` |
| Admin | `admin@v3bks.id` | `admin123` |
| Finance | `finance@v3bks.id` | `finance123` |

## Deploy ke produksi (PostgreSQL)
Panduan lengkap ada di **[`DEPLOY.md`](./DEPLOY.md)**. Ringkas:
1. Ubah `datasource db { provider = "postgresql" }` di `prisma/schema.prisma`.
2. Set `DATABASE_URL` ke koneksi Postgres dan `AUTH_SECRET` yang kuat (`openssl rand -base64 32`).
3. `npx prisma migrate deploy && npm run seed` (opsional seed).
4. `npm run build && npm start` (atau deploy ke Vercel). `docker-compose.yml` disediakan untuk Postgres lokal.

## Skrip
| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan dev server |
| `npm run build` | Build produksi |
| `npm run seed` | Isi data awal |
| `npm run db:reset` | Reset DB + seed ulang |

## Status
Fase 0–6 selesai: MVP inti + laporan (ekspor Excel & Cetak/PDF) + budgeting dengan alert over-budget + CRUD master data & manajemen pengguna role-based + navigasi mobile + impor massal CSV + **audit log** + **kesiapan deploy produksi (PostgreSQL + Vercel, lihat `DEPLOY.md`)**. Aplikasi responsif di desktop & mobile. Narasi insight berbasis LLM direncanakan sebagai penyempurnaan opsional.

## Peran & Akses
| Role | Akses |
|---|---|
| **Owner** | Semua fitur + kelola pengguna (termasuk membuat owner) |
| **Admin** | Semua fitur + kelola pengguna (admin/finance) & parameter |
| **Finance** | Transaksi, laporan, budgeting (tidak bisa kelola pengguna) |
