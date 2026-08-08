"use client";

export default function PrintButton({ label = "🖨️ Cetak / Simpan PDF" }: { label?: string }) {
  return (
    <button onClick={() => window.print()} className="btn-primary text-xs print:hidden">
      {label}
    </button>
  );
}
