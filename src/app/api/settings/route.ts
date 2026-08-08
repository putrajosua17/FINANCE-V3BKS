import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await requireRole(["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  try {
    const b = await req.json();
    const entries: { key: string; value: string }[] = Array.isArray(b.settings) ? b.settings : [];
    for (const e of entries) {
      if (!e.key) continue;
      await prisma.setting.upsert({
        where: { key: e.key },
        update: { value: String(e.value) },
        create: { key: e.key, value: String(e.value) },
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 500 });
  }
}
