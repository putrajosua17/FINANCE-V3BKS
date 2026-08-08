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
- **Daftar Rekening** — saldo & mutasi Cash/BCA/Mandiri/BNI.
- **Target & Tagihan** — target harian/bulanan, tandai tagihan rutin lunas, lunasi piutang penyewa.
- **Booking & Jadwal** — daftar booking + status + analisa jam main.
- **Laporan Keuangan** — laba rugi bulanan, kategori, estimasi pajak.
- **Budgeting & Prediksi** — proyeksi run-rate akhir bulan.
- **FlowAI Insight** — insight otomatis berbasis rule.
- **Panduan** & **Pengaturan** (master data).

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
1. Ubah `datasource db { provider = "postgresql" }` di `prisma/schema.prisma`.
2. Set `DATABASE_URL` ke koneksi Postgres dan `AUTH_SECRET` yang kuat (`openssl rand -base64 32`).
3. `npx prisma migrate deploy && npm run seed` (opsional seed).
4. `npm run build && npm start` (atau deploy ke Vercel).

## Skrip
| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan dev server |
| `npm run build` | Build produksi |
| `npm run seed` | Isi data awal |
| `npm run db:reset` | Reset DB + seed ulang |

## Status
Fase 0–2 (MVP inti) selesai. Ekspor PDF/Excel, budget per kategori, dan narasi insight LLM direncanakan pada Fase 3+.
