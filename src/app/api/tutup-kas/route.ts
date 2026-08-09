import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { formatRupiah } from "@/lib/format";
import { saldoSistemAkun } from "@/lib/cash";
import { assertPeriodOpen, PeriodLockedError } from "@/lib/period-lock";

const AMBANG_NOTIFIKASI = 50000; // selisih > Rp50.000 memicu perhatian owner

// Ambil saldo sistem yang seharusnya untuk rekening & tanggal tertentu.
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId") || "";
  const tanggal = searchParams.get("tanggal") ? new Date(searchParams.get("tanggal")!) : new Date();
  if (!accountId) return NextResponse.json({ error: "accountId wajib" }, { status: 400 });
  const saldoSistem = await saldoSistemAkun(prisma, accountId, tanggal);
  return NextResponse.json({ saldoSistem });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await req.json();
    const accountId = String(b.accountId || "");
    const shift = String(b.shift || "harian");
    const tanggal = b.tanggal ? new Date(b.tanggal) : new Date();
    const saldoFisik = Number(b.saldoFisik);
    if (!accountId) return NextResponse.json({ error: "Rekening kas wajib dipilih" }, { status: 400 });
    if (!Number.isFinite(saldoFisik)) return NextResponse.json({ error: "Saldo fisik tidak valid" }, { status: 400 });

    await assertPeriodOpen(prisma, tanggal, b.businessUnitId || undefined);

    const saldoSistem = await saldoSistemAkun(prisma, accountId, tanggal);
    const selisih = Math.round((saldoFisik - saldoSistem) * 100) / 100;
    if (selisih !== 0 && !b.catatan) {
      return NextResponse.json({ error: "Selisih ≠ 0 — catatan wajib diisi." }, { status: 400 });
    }

    const closing = await prisma.cashClosing.create({
      data: {
        tanggal,
        shift,
        accountId,
        businessUnitId: b.businessUnitId || null,
        saldoSistem,
        saldoFisik,
        selisih,
        rincianPecahan: b.rincianPecahan ?? undefined,
        catatan: b.catatan || null,
        status: "diajukan",
        dibuatOlehId: session.id,
      },
    });

    await logAudit(session, "create", "cashclosing", `Tutup kas ${shift} · selisih ${formatRupiah(selisih)}`, {
      nilaiBaru: { saldoSistem, saldoFisik, selisih },
    });
    if (Math.abs(selisih) > AMBANG_NOTIFIKASI) {
      await logAudit(session, "warning", "cashclosing", `⚠️ Selisih kas ${formatRupiah(selisih)} melampaui ambang ${formatRupiah(AMBANG_NOTIFIKASI)} — perlu perhatian owner.`);
    }
    return NextResponse.json({ ok: true, id: closing.id, selisih });
  } catch (e) {
    if (e instanceof PeriodLockedError) return NextResponse.json({ error: e.message }, { status: 423 });
    // Pelanggaran unique (tanggal+shift+akun sudah ada)
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Tutup kas untuk tanggal, shift, & rekening ini sudah ada." }, { status: 409 });
    }
    return NextResponse.json({ error: "Gagal menyimpan tutup kas" }, { status: 500 });
  }
}
