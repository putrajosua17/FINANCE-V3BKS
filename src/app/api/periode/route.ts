import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// GET: daftar status kunci periode
export async function GET() {
  const locks = await prisma.periodLock.findMany({ orderBy: { periode: "desc" } });
  return NextResponse.json({ locks });
}

// POST: kunci / buka periode. { periode, businessUnitId?, action, catatan? }
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  const periode: string = String(b.periode || "");
  const action: string = b.action === "unlock" ? "unlock" : "lock";
  const businessUnitId: string | null = b.businessUnitId || null;
  const catatan: string | null = b.catatan || null;

  if (!/^\d{4}-\d{2}$/.test(periode)) {
    return NextResponse.json({ error: "Periode tidak valid (format YYYY-MM)." }, { status: 400 });
  }

  // Kunci: owner & finance. Buka kembali: hanya owner + wajib alasan.
  if (action === "lock" && !["owner", "finance"].includes(session.role)) {
    return NextResponse.json({ error: "Hanya owner/finance yang dapat mengunci periode." }, { status: 403 });
  }
  if (action === "unlock") {
    if (session.role !== "owner") {
      return NextResponse.json({ error: "Hanya owner yang dapat membuka kembali periode terkunci." }, { status: 403 });
    }
    if (!catatan) {
      return NextResponse.json({ error: "Alasan wajib diisi saat membuka periode." }, { status: 400 });
    }
  }

  // Compound unique memuat kolom nullable → gunakan findFirst + create/update
  // agar kunci global (businessUnitId = null) tetap didukung.
  const existing = await prisma.periodLock.findFirst({ where: { periode, businessUnitId } });

  const status = action === "lock" ? "terkunci" : "terbuka";
  const fields = {
    status,
    catatan,
    dikunciOlehId: action === "lock" ? session.id : null,
    dikunciPada: action === "lock" ? new Date() : null,
  };
  const lock = existing
    ? await prisma.periodLock.update({ where: { id: existing.id }, data: fields })
    : await prisma.periodLock.create({ data: { periode, businessUnitId, ...fields } });

  await logAudit(session, action, "periode", `Periode ${periode}${businessUnitId ? " (unit)" : ""} → ${status}`, {
    nilaiLama: existing ? { status: existing.status } : undefined,
    nilaiBaru: { status, catatan },
  });

  return NextResponse.json({ ok: true, lock });
}
