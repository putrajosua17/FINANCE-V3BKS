import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await requireRole(["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  try {
    const b = await req.json();
    if (!b.nama || !b.email || !b.password) {
      return NextResponse.json({ error: "Nama, email, password wajib" }, { status: 400 });
    }
    const email = String(b.email).toLowerCase().trim();
    const exist = await prisma.user.findUnique({ where: { email } });
    if (exist) return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    const role = ["owner", "admin", "finance"].includes(b.role) ? b.role : "admin";
    const user = await prisma.user.create({
      data: { nama: String(b.nama).trim(), email, passwordHash: await hashPassword(String(b.password)), role },
    });
    return NextResponse.json({ ok: true, item: { id: user.id, nama: user.nama, email: user.email, role: user.role } });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan pengguna" }, { status: 500 });
  }
}
