import { NextResponse } from "next/server";
import { runSetup } from "@/lib/setup";
import { timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";

/**
 * Inisialisasi database (master data + owner) — dipanggil sekali setelah deploy.
 * Endpoint mutasi ini hanya menerima POST dengan token setup terpisah.
 */
export async function POST(req: Request) {
  const configured = process.env.SETUP_TOKEN;
  const provided = req.headers.get("x-setup-token") || "";
  if (!configured || configured.length < 24 || provided.length !== configured.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(configured))) {
    return NextResponse.json({ ok: false, error: "Akses setup ditolak." }, { status: 403 });
  }
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
