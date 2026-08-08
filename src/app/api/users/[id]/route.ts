import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, hashPassword } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const { id } = await params;
  try {
    const b = await req.json();
    const data: Record<string, unknown> = {};
    if (b.nama !== undefined) data.nama = String(b.nama).trim();
    if (b.role !== undefined && ["owner", "admin", "finance"].includes(b.role)) data.role = b.role;
    if (b.isActive !== undefined) data.isActive = Boolean(b.isActive);
    if (b.password) data.passwordHash = await hashPassword(String(b.password));
    const user = await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item: { id: user.id, nama: user.nama, role: user.role, isActive: user.isActive } });
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["owner"]);
  if (!session) return NextResponse.json({ error: "Hanya owner yang dapat menghapus" }, { status: 403 });
  const { id } = await params;
  if (id === session.id) return NextResponse.json({ error: "Tidak bisa menghapus diri sendiri" }, { status: 400 });
  try {
    // Amankan: nonaktifkan agar histori transaksi tetap utuh
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true, deactivated: true });
  } catch {
    return NextResponse.json({ error: "Gagal menonaktifkan" }, { status: 500 });
  }
}
