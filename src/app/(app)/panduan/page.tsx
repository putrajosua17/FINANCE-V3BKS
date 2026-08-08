export const dynamic = "force-dynamic";

const SECTIONS = [
  { t: "Dashboard", d: "Ringkasan KPI keuangan: total saldo, pemasukan, pengeluaran, rasio laba, nilai kekayaan, dan status kesehatan. Gunakan toggle Bulan Lalu/Bulan Ini di header." },
  { t: "Tambah Transaksi", d: "Catat Pemasukan (booking/jasa) atau Pengeluaran. Pilih Kode Tarif untuk mengisi harga otomatis. Tombol Quick Spend untuk pengeluaran cepat." },
  { t: "Riwayat Transaksi", d: "Lihat, cari, filter, dan hapus semua transaksi." },
  { t: "Daftar Rekening", d: "Saldo & mutasi tiap rekening: Cash, BCA, Mandiri, BNI." },
  { t: "Target & Tagihan", d: "Pantau target harian (Rp6.000.000) & bulanan. Tandai tagihan rutin lunas dan lunasi piutang penyewa." },
  { t: "Booking & Jadwal", d: "Daftar booking, status pembayaran, dan analisa jam main." },
  { t: "Laporan Keuangan", d: "Laba rugi bulanan, breakdown kategori, dan estimasi pajak." },
  { t: "Budgeting & Prediksi", d: "Proyeksi akhir bulan berbasis run-rate dan realisasi pengeluaran per kategori." },
];

const GLOSARI = [
  ["DP", "Uang muka saat booking."],
  ["Pelunasan", "Sisa pembayaran setelah DP (piutang)."],
  ["PPh Final 0,5%", "Pajak penghasilan final 0,5% dari omzet kotor (UMKM)."],
  ["Pajak Daerah 10%", "Pajak hiburan/daerah 10% dari rental sales."],
  ["Rasio Laba", "Profit dibagi pemasukan, dalam persen."],
];

export default function PanduanPage() {
  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-base font-semibold text-white">Panduan Penggunaan</h2>
        <p className="text-xs text-slate-500">Ringkasan tiap modul & istilah.</p>
      </div>

      <div className="card space-y-3">
        <p className="card-title">Modul</p>
        {SECTIONS.map((s) => (
          <div key={s.t} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
            <p className="text-sm font-medium text-slate-200">{s.t}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.d}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <p className="card-title mb-3">Glosarium</p>
        <dl className="space-y-2">
          {GLOSARI.map(([k, v]) => (
            <div key={k} className="flex gap-3 text-sm">
              <dt className="w-32 shrink-0 text-slate-300 font-medium">{k}</dt>
              <dd className="text-slate-400">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
