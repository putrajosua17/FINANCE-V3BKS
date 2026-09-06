import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isFinance } from "@/lib/access";
import { approveImport } from "@/lib/import-service";
import type { ParsedRow } from "@/lib/v3bks-import";
type Context = { params: Promise<{ id: string }> };
export async function GET(req: Request, context: Context) {
  const user = await getSession(); const { id } = await context.params;
  if (!user) return NextResponse.json({ error: "Masuk kembali." }, { status: 401 });
  const batch = await prisma.importBatch.findUnique({ where: { id }, include: { lines: { orderBy: { sourceRow: "asc" } } } });
  if (!batch || (user.role === "admin" && batch.uploadedById !== user.id)) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  if (new URL(req.url).searchParams.has("download")) return new Response(batch.csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="tracker.csv"' } });
  const [categories, accounts, previous] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, select: { id: true, nama: true, tipe: true } }),
    prisma.account.findMany({ where: { isActive: true }, select: { id: true, nama: true } }),
    isFinance(user.role) ? prisma.transaction.findMany({ where: { deletedAt: null, tanggal: { gte: new Date(Math.min(...batch.lines.map(l => Date.parse((l.payload as ParsedRow).tanggal)))), lt: new Date(Math.max(...batch.lines.map(l => Date.parse((l.payload as ParsedRow).tanggal))) + 86400000) } }, include: { account: true, category: true }, take: 1000 }) : Promise.resolve([]),
  ]);
  return NextResponse.json({ batch: { ...batch, csv: undefined }, categories, accounts, previous, canApprove: isFinance(user.role) });
}
export async function PATCH(req: Request, context: Context) {
  const user = await getSession(); const { id } = await context.params;
  if (!user) return NextResponse.json({ error: "Masuk kembali." }, { status: 401 });
  try {
    const body = await req.json();
    if (body.action === "approve") {
      if (!isFinance(user.role)) return NextResponse.json({ error: "Hanya finance/owner dapat menyetujui." }, { status: 403 });
      await approveImport(id, user); return NextResponse.json({ ok: true });
    }
    await prisma.$transaction(async db => {
      await db.$executeRaw`SELECT pg_advisory_xact_lock(7300601)`;
      const batch = await db.importBatch.findUnique({ where: { id }, include: { lines: true } });
      if (!batch || (user.role === "admin" && batch.uploadedById !== user.id)) throw new Error("Impor tidak ditemukan.");
      if (["approved", "rejected"].includes(batch.status)) throw new Error("Impor sudah selesai dan tidak dapat diedit.");
      if (body.action === "reject" || body.action === "return") {
        if (!isFinance(user.role) || !String(body.note || "").trim()) throw new Error("Finance wajib mengisi alasan.");
        await db.importBatch.update({ where: { id }, data: { status: body.action === "return" ? "needs_fix" : "rejected", reviewNote: String(body.note).slice(0, 2000), reviewedById: user.id } });
      } else if (body.action === "submit") {
        if (batch.status === "submitted") throw new Error("Sudah diajukan.");
        if (batch.lines.some(l => l.decision !== "skip" && (!l.categoryId || !l.accountId || l.decision === "review"))) throw new Error("Lengkapi pemetaan dan keputusan semua baris terlebih dahulu.");
        await db.importBatch.update({ where: { id }, data: { status: "submitted" } });
      } else if (body.action === "line") {
        if (batch.status === "submitted" && !isFinance(user.role)) throw new Error("Sedang diperiksa finance.");
        const line = batch.lines.find(l => l.id === body.lineId);
        if (!line || !["new", "skip", "replace"].includes(body.decision)) throw new Error("Keputusan tidak valid.");
        if (body.decision === "replace" && !isFinance(user.role)) throw new Error("Koreksi transaksi dilakukan finance.");
        await db.importLine.update({ where: { id: line.id }, data: { categoryId: body.categoryId || null, accountId: body.accountId || null, decision: body.decision, replacesId: body.decision === "replace" ? body.replacesId || null : null } });
      } else throw new Error("Tindakan tidak dikenal.");
      await db.auditLog.create({ data: { userId: user.id, userName: user.nama, aksi: body.action, entitas: "import", detail: id } });
    });
    return NextResponse.json({ ok: true });
  } catch (e) { console.error("[imports]", e); return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal menyimpan" }, { status: 400 }); }
}
