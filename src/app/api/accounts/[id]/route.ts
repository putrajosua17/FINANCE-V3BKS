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
    if (b.tipe !== undefined) data.tipe = b.tipe === "cash" ? "cash" : "bank";
    if (b.saldoAwal !== undefined) return NextResponse.json({error:"Ubah saldo awal melalui Daftar Rekening dengan tanggal dan bukti."},{status:400});
    if (b.isActive !== undefined) data.isActive = Boolean(b.isActive);
    const acc = await prisma.account.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item: acc });
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await prisma.account.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}
