import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await requireRole(["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  try {
    const b = await req.json();
    if (!b.nama || !b.email || !b.password) {
      return NextResponse.json({ error: "Nama, email, password wajib" }, { status: 400 });
    }
    if (String(b.password).length < 12) {
      return NextResponse.json({ error: "Password minimal 12 karakter" }, { status: 400 });
    }
    const email = String(b.email).toLowerCase().trim();
    const exist = await prisma.user.findUnique({ where: { email } });
    if (exist) return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    const requestedRole = ["owner", "admin", "finance"].includes(b.role) ? b.role : "admin";
    const role = session.role === "owner" ? requestedRole : requestedRole === "owner" ? "admin" : requestedRole;
    const user = await prisma.user.create({
      data: { nama: String(b.nama).trim(), email, passwordHash: await hashPassword(String(b.password)), role },
    });
    await logAudit(session, "create", "user", `${user.nama} · ${user.role}`);
    return NextResponse.json({ ok: true, item: { id: user.id, nama: user.nama, email: user.email, role: user.role } });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan pengguna" }, { status: 500 });
  }
}
