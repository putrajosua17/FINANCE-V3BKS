# Panduan Deploy Produksi — V3BKS FinanceFlow

Aplikasi ini dikembangkan dengan **SQLite** untuk kemudahan pengembangan lokal, dan siap dipindah ke **PostgreSQL** untuk produksi. Berikut langkah lengkapnya.

---

## 1. Siapkan Database PostgreSQL

Pilih salah satu penyedia (gratis untuk memulai):
- **Neon** — https://neon.tech (serverless Postgres, cocok untuk Vercel)
- **Supabase** — https://supabase.com
- **Railway** / VPS sendiri

Catat connection string-nya, contoh:
```
postgresql://user:password@host:5432/v3bks?sslmode=require
```

### Alternatif: Postgres lokal via Docker
```bash
docker compose up -d        # menggunakan docker-compose.yml yang disediakan
# DATABASE_URL="postgresql://v3bks:v3bks@localhost:5432/v3bks?schema=public"
```

---

## 2. Ubah Provider Prisma ke PostgreSQL

Edit `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"   // sebelumnya "sqlite"
  url      = env("DATABASE_URL")
}
```

> Skema tabel identik — tidak ada perubahan lain yang diperlukan.

---

## 3. Konfigurasi Environment Variable

Salin `.env.production.example` → `.env` (atau set di dashboard Vercel):

| Variabel | Keterangan |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL |
| `AUTH_SECRET` | Rahasia JWT — buat dengan `openssl rand -base64 32` |
| `SEED_OWNER_EMAIL` | Email owner awal (untuk seed) |
| `SEED_OWNER_PASSWORD` | Password owner awal (ganti setelah login!) |

---

## 4. Migrasi Skema & Seed Data

```bash
npm install
npx prisma migrate deploy   # atau: npx prisma db push
npm run seed                # opsional: isi master data + data Agustus 2026
```

> **Penting:** setelah login pertama, segera ganti password owner & user demo lewat menu **Pengaturan → Pengguna**, atau hapus user demo.

---

## 5. Build & Jalankan

### A. Deploy ke Vercel (disarankan)
1. Push repo ke GitHub (sudah).
2. Import project di https://vercel.com/new.
3. Set Environment Variables (langkah 3) di **Project Settings → Environment Variables**.
4. Build Command: `npm run build` (sudah menjalankan `prisma generate`).
5. Deploy. Vercel otomatis menjalankan `next build`.

> Jalankan `npx prisma migrate deploy` sekali dari lokal (dengan `DATABASE_URL` produksi) atau tambahkan sebagai build step, karena Vercel tidak menjalankan migrasi otomatis.

### B. Deploy ke VPS / server sendiri
```bash
npm run build
npm start                   # default port 3000, atur dengan PORT=xxxx
```
Gunakan process manager (PM2/systemd) + reverse proxy (Nginx) untuk HTTPS.

---

## 6. Checklist Keamanan Produksi
- [ ] `AUTH_SECRET` acak & panjang (bukan nilai default dev).
- [ ] Password owner & semua user demo sudah diganti/dihapus.
- [ ] `DATABASE_URL` memakai SSL (`sslmode=require`).
- [ ] Cookie session otomatis `Secure` di produksi (sudah diatur di kode).
- [ ] Backup database dijadwalkan (fitur bawaan penyedia Postgres).

---

## Catatan
- Data awal seed adalah periode **Agustus 2026** sesuai kesepakatan. Untuk mulai bersih, jalankan seed lalu hapus transaksi contoh, atau kosongkan array `incomes`/`expenses` di `prisma/seed.ts`.
- Semua perhitungan (KPI, pajak, target, saldo) dihitung dari transaksi — tidak ada angka hardcode.
