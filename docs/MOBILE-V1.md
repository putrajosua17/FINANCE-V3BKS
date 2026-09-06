# V3BKS Mini Soccer — versi operasional web

## Tujuan
Satu tautan responsif untuk kasir di Android/iOS dan finance/owner di desktop. Versi pertama untuk V3BKS; tracker tetap menjadi sumber pembayaran melalui CSV. Tidak ada aplikasi toko atau booking mandiri pelanggan pada tahap ini. Akses internet diperlukan.

## Peran
- Admin/kasir: unggah dan periksa draf sendiri, kirim ke finance, lihat pembayaran sendiri, bukti/catatan, tutup kas.
- Finance: tinjau seluruh unggahan, setujui atau kembalikan, koreksi pembayaran, hubungkan booking, rekonsiliasi, rekening, laporan, kunci periode.
- Owner: akses finance dan pengelolaan pengguna.

## Aturan pencatatan
Draf/submitted belum memengaruhi transaksi atau jurnal. Persetujuan atomik memposting transaksi dan jurnal. Pembayaran ulang identik dilewati; perubahan harus diputuskan sebagai baru atau pengganti. Pengganti membalik jurnal lama dan menonaktifkan transaksi lama. Kategori/rekening tidak dikenal memblokir persetujuan. Periode terkunci memblokir posting dan koreksi.

DP dan pelunasan ditautkan ke booking dari pembayaran yang sudah tercatat, tanpa penerimaan tambahan. Saldo awal bertanggal disertai referensi bukti. Transfer antar rekening sendiri hanya mengubah saldo rekening dan jurnal, tidak omzet/beban. Tutup kas berselisih tidak menghasilkan jurnal otomatis. Semua saran bank membutuhkan konfirmasi.

## Batasan versi ini
- CSV hanya mendukung format tracker V3BKS dua blok Income/Expenses. Maksimal 1,5 MB dan 2.000 transaksi.
- Bukti JPG/PNG/PDF maksimal 2 MB disimpan di database dan dilindungi autentikasi.
- Pencocokan mutasi transfer antar rekening masih diperiksa manual; matcher bank saat ini menyarankan transaksi pendapatan/beban.
- Snapshot/restore menggunakan fasilitas penyedia Postgres; aplikasi belum memiliki tombol pemulihan database.
- Browser target adalah Safari iOS, Chrome Android, dan browser desktop modern; pengujian perangkat fisik tetap diperlukan sebelum penggunaan reguler.

## Verifikasi
`npm test`, `npx tsc --noEmit`, `npm run build`.
`DATABASE_URL=postgresql://...@127.0.0.1:PORT/postgres node --import tsx scripts/verify-import-flow.ts` hanya pada database uji kosong setelah migrasi. Memverifikasi isolasi draf, pengulangan, posting jurnal, koreksi/pembalikan, rollback kegagalan, dan kunci periode. Jangan jalankan pada produksi.

## Rilis
Migrasi 20260906000000_mobile_import_approval bersifat penambahan tabel/kolom. Tidak menghapus data lama. Jalankan seluruh migrasi dan seed accounting idempoten sebelum build. Pastikan cadangan database tersedia. Rollback kode tidak boleh menghapus tabel audit/import atau jurnal yang telah diposting.
