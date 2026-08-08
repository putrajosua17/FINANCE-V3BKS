import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { categoryId, periode, nominal } = await req.json();
    if (!categoryId || !periode) {
      return NextResponse.json({ error: "categoryId & periode wajib" }, { status: 400 });
    }
    const nom = Math.max(0, Number(nominal) || 0);

    const budget = await prisma.budget.upsert({
      where: { categoryId_periode: { categoryId, periode } },
      update: { nominal: nom },
      create: { categoryId, periode, nominal: nom },
    });
    return NextResponse.json({ ok: true, budget });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan anggaran" }, { status: 500 });
  }
}
