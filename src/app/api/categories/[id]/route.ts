import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const b = await req.json();
    const data: Record<string, unknown> = {};
    if (b.nama !== undefined) data.nama = String(b.nama).trim();
    if (b.isRecurring !== undefined) data.isRecurring = Boolean(b.isRecurring);
    if (b.isActive !== undefined) data.isActive = Boolean(b.isActive);
    const cat = await prisma.category.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item: cat });
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const used = await prisma.transaction.count({ where: { categoryId: id } });
    if (used > 0) {
      // Jangan hapus bila terpakai — nonaktifkan saja
      await prisma.category.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({ ok: true, deactivated: true });
    }
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}
