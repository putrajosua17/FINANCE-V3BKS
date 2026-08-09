import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { parseStatement, type BankKode, SUPPORTED_BANKS } from "@/lib/bank-parsers";
import { autoReconcile } from "@/lib/reconcile";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await req.formData();
    const accountId = String(form.get("accountId") || "");
    const bank = String(form.get("bank") || "generic") as BankKode;
    const file = form.get("file");
    if (!accountId) return NextResponse.json({ error: "Rekening wajib dipilih" }, { status: 400 });
    if (!(file instanceof File)) return NextResponse.json({ error: "File e-statement wajib diunggah" }, { status: 400 });
    const bankKode: BankKode = (SUPPORTED_BANKS as readonly string[]).includes(bank) ? bank : "generic";

    const text = await file.text();
    const parsed = parseStatement(bankKode, text);
    if (parsed.lines.length === 0) {
      return NextResponse.json({ error: "Tidak ada baris mutasi yang bisa dibaca dari file ini." }, { status: 400 });
    }

    const tgls = parsed.lines.map((l) => l.tanggal.getTime());
    const periodeAwal = new Date(Math.min(...tgls));
    const periodeAkhir = new Date(Math.max(...tgls));
    const saldoAwalInput = form.get("saldoAwal") ? Number(form.get("saldoAwal")) : null;
    const saldoAkhirInput = form.get("saldoAkhir") ? Number(form.get("saldoAkhir")) : null;
    // Bila saldo tidak diisi, gunakan kolom saldo pada baris (bila ada).
    const saldoAwal = saldoAwalInput ?? (parsed.lines[0].saldo != null ? parsed.lines[0].saldo - (parsed.lines[0].kredit - parsed.lines[0].debit) : 0);
    const saldoAkhir = saldoAkhirInput ?? (parsed.lines[parsed.lines.length - 1].saldo ?? 0);

    const statement = await prisma.$transaction(async (db) => {
      const st = await db.bankStatement.create({
        data: {
          accountId,
          periodeAwal,
          periodeAkhir,
          saldoAwal,
          saldoAkhir,
          namaFile: `${bankKode.toUpperCase()} · ${file.name}`,
          status: "rekonsiliasi",
          createdById: session.id,
          lines: {
            create: parsed.lines.map((l) => ({
              tanggal: l.tanggal,
              keterangan: l.keterangan,
              debit: l.debit,
              kredit: l.kredit,
              saldo: l.saldo ?? null,
              refBank: l.refBank ?? null,
            })),
          },
        },
      });
      await autoReconcile(db, st.id);
      return st;
    });

    await logAudit(session, "import", "rekonsiliasi", `E-statement ${bankKode.toUpperCase()} · ${parsed.terparse}/${parsed.totalBaris} baris`);
    return NextResponse.json({ ok: true, id: statement.id, terparse: parsed.terparse, total: parsed.totalBaris });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal memproses e-statement" }, { status: 500 });
  }
}
