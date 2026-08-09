import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tipe = searchParams.get("tipe") || undefined; // pelanggan | vendor
  const where: Record<string, unknown> = { isActive: true };
  if (tipe === "vendor") where.tipe = { in: ["vendor", "keduanya"] };
  else if (tipe === "pelanggan") where.tipe = { in: ["pelanggan", "keduanya"] };
  const items = await prisma.contact.findMany({ where, orderBy: { nama: "asc" } });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    if (!b.nama) return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
    const c = await prisma.contact.create({
      data: {
        tipe: ["pelanggan", "vendor", "keduanya"].includes(b.tipe) ? b.tipe : "vendor",
        nama: String(b.nama),
        noHp: b.noHp || null,
        email: b.email || null,
        alamat: b.alamat || null,
        npwp: b.npwp || null,
        termin: b.termin ? Number(b.termin) : 0,
        limitKredit: b.limitKredit ? Number(b.limitKredit) : null,
      },
    });
    await logAudit(session, "create", "contact", `${c.tipe} · ${c.nama}`);
    return NextResponse.json({ ok: true, id: c.id });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan kontak" }, { status: 500 });
  }
}
