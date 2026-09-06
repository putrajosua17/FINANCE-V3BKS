import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createImport } from "@/lib/import-service";
import { prisma } from "@/lib/prisma";
export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Masuk kembali." }, { status: 401 });
  const items = await prisma.importBatch.findMany({ where: user.role === "admin" ? { uploadedById: user.id } : {},
    select: { id: true, fileName: true, status: true, uploadedByName: true, createdAt: true, reviewNote: true, _count: { select: { lines: true } } },
    orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ items });
}
export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Masuk kembali." }, { status: 401 });
  try {
    const { csv, fileName } = await req.json();
    if (typeof csv !== "string" || csv.length > 1500000) throw new Error("CSV wajib diisi dan maksimal 1,5 MB.");
    const batch = await createImport(csv, String(fileName || "tracker.csv"), user);
    return NextResponse.json({ id: batch.id });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Impor gagal" }, { status: 400 }); }
}
