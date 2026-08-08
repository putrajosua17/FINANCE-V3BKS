import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { formatRupiah } from "@/lib/format";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const tx = await prisma.transaction.findUnique({ where: { id }, include: { category: true } });
    await prisma.transaction.delete({ where: { id } });
    if (tx) await logAudit(session, "delete", "transaction", `${tx.tipe} ${formatRupiah(tx.jumlah)} · ${tx.category.nama}`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}
