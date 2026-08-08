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
    if (b.kelompok !== undefined) data.kelompok = String(b.kelompok).trim();
    if (b.hari !== undefined) data.hari = b.hari || null;
    if (b.jamMulai !== undefined) data.jamMulai = b.jamMulai || null;
    if (b.jamSelesai !== undefined) data.jamSelesai = b.jamSelesai || null;
    if (b.durasi !== undefined) data.durasi = b.durasi ? Number(b.durasi) : null;
    if (b.harga !== undefined) data.harga = Math.max(0, Number(b.harga) || 0);
    if (b.isActive !== undefined) data.isActive = Boolean(b.isActive);
    const rc = await prisma.rateCard.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item: rc });
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await prisma.rateCard.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}
