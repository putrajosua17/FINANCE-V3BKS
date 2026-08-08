# Panduan Deploy — V3BKS FinanceFlow (Vercel + Neon)

Aplikasi sudah dikonfigurasi untuk **PostgreSQL** + **Vercel**:
- `prisma/schema.prisma` → `provider = "postgresql"`
- Migrasi awal tersedia di `prisma/migrations/` (dijalankan otomatis saat build).
- `vercel.json` menjalankan `prisma generate && prisma migrate deploy && next build`.
- Seed produksi idempotent: `npm run seed:prod` (master data + owner, tanpa data contoh).

Ikuti langkah berikut (± 10 menit).

---

## Langkah 1 — Buat Database di Neon
1. Daftar/masuk ke https://neon.tech (gratis).
2. **Create Project** → beri nama `v3bks`. Region terdekat (mis. Singapore).
3. Setelah dibuat, buka **Connection Details** → salin **connection string** (pooled), bentuknya:
   ```
   postgresql://USER:PASSWORD@ep-xxxx.ap-southeast-1.aws.neon.tech/v3bks?sslmode=require
   ```
   Simpan sementara — akan dipakai di Vercel (jangan commit ke Git).

---

## Langkah 2 — Deploy ke Vercel
1. Masuk ke https://vercel.com dengan akun GitHub Anda.
2. **Add New → Project** → pilih repo **`putrajosua17/FINANCE-V3BKS`**.
3. Pastikan **Branch** = `claude/prd-aplikasi-gambar-pdf-ffqbhy` (atau merge dulu ke `main`, lalu pilih `main`).
4. Framework otomatis terdeteksi **Next.js**. Build command sudah diatur lewat `vercel.json` — biarkan default.
5. Buka **Environment Variables**, tambahkan:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | (connection string Neon dari Langkah 1) |
   | `AUTH_SECRET` | hasil `openssl rand -base64 32` (atau string acak panjang) |
   | `SEED_OWNER_EMAIL` | email login owner, mis. `owner@v3bks.id` |
   | `SEED_OWNER_PASSWORD` | password owner awal (ganti setelah login) |

6. Klik **Deploy**. Saat build, `prisma migrate deploy` otomatis membuat seluruh tabel di Neon.

---

## Langkah 3 — Isi Master Data (sekali saja)
Setelah deploy pertama, database sudah bertabel tapi masih kosong (belum ada login). Isi master data + owner:

**Cara A — dari komputer Anda (disarankan):**
```bash
# di folder proyek, pakai DATABASE_URL Neon
export DATABASE_URL="postgresql://...neon.../v3bks?sslmode=require"
export SEED_OWNER_EMAIL="owner@v3bks.id"
export SEED_OWNER_PASSWORD="passwordAnda"
npm install
npm run seed:prod        # idempotent — aman diulang; tidak menghapus data
```
> Ingin sekaligus memuat data contoh Agustus 2026? Gunakan `npm run seed` (⚠️ ini menghapus data lama — hanya untuk database baru/kosong).

**Cara B — via Neon SQL Editor:** jalankan migrasi & seed dari lokal seperti di atas (Neon tidak menjalankan skrip Node, jadi seed tetap dari mesin Anda).

---

## Langkah 4 — Login & Amankan
1. Buka URL Vercel Anda → halaman login.
2. Masuk dengan `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD`.
3. **Pengaturan → Pengguna**: ganti password owner, tambah user admin/finance, hapus user demo bila ada.

---

## Checklist Keamanan Produksi
- [ ] `AUTH_SECRET` acak & panjang (bukan nilai dev).
- [ ] Password owner sudah diganti setelah login pertama.
- [ ] `DATABASE_URL` memakai `sslmode=require` (default Neon).
- [ ] Cookie session otomatis `Secure` di produksi (sudah di kode).
- [ ] Backup: Neon punya point-in-time restore bawaan.

---

## Pengembangan Lokal (opsional)
```bash
docker compose up -d                # Postgres lokal
cp .env.example .env
npx prisma migrate deploy
npm run seed                        # data contoh
npm run dev
```

## Catatan
- Semua angka (KPI, pajak, target, saldo) dihitung dari transaksi — tidak ada nilai hardcode.
- Perubahan skema di masa depan: buat migrasi baru dengan `npx prisma migrate dev --name <nama>`, commit folder `prisma/migrations/`, dan Vercel akan menerapkannya otomatis saat build berikutnya.
