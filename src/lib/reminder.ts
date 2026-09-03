// -----------------------------------------------------------------------------
// F-10 · Reminder piutang (semi-otomatis via wa.me)
// -----------------------------------------------------------------------------
import { formatRupiah, formatTanggal } from "@/lib/format";

export const DEFAULT_TEMPLATE_AR =
  "Halo {nama}, mengingatkan booking tanggal {tanggal_main} masih ada sisa pembayaran {sisa} dari total {jumlah}. Mohon diselesaikan ya 🙏 Terima kasih — V3BKS";

/** Ambil digit nomor dari berbagai format (wa.me/08.., 0812.., +62..) → 62xxxx. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = raw.match(/(\d[\d\s-]{6,})/);
  if (!m) return null;
  let d = m[1].replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("620")) d = "62" + d.slice(3);
  else if (!d.startsWith("62")) d = "62" + d;
  return d;
}

export function fillTemplate(
  template: string,
  vars: { nama: string; jumlah: number; tanggalMain: Date; sisa: number }
): string {
  return template
    .replaceAll("{nama}", vars.nama)
    .replaceAll("{jumlah}", formatRupiah(vars.jumlah))
    .replaceAll("{tanggal_main}", formatTanggal(vars.tanggalMain, true))
    .replaceAll("{sisa}", formatRupiah(vars.sisa));
}

/** Bangun tautan wa.me siap kirim (null bila nomor tak valid). */
export function waLink(
  noHp: string | null | undefined,
  template: string,
  vars: { nama: string; jumlah: number; tanggalMain: Date; sisa: number }
): string | null {
  const phone = normalizePhone(noHp);
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(fillTemplate(template, vars))}`;
}
