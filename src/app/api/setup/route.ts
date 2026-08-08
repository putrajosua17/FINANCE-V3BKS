import { NextResponse } from "next/server";
import { runSetup } from "@/lib/setup";

export const dynamic = "force-dynamic";

/**
 * Inisialisasi database (master data + owner) — dipanggil sekali setelah deploy.
 * Aman & idempotent: tidak menerima input pengguna, tidak menimpa data yang ada.
 * Cukup buka /api/setup di browser sekali.
 */
export async function GET() {
  try {
    const result = await runSetup();
    return NextResponse.json({
      ok: true,
      message: "Database siap. Silakan login dengan email & password owner Anda.",
      ...result,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Gagal inisialisasi. Pastikan DATABASE_URL benar & migrasi sudah jalan.", detail: String(e).slice(0, 300) },
      { status: 500 }
    );
  }
}
