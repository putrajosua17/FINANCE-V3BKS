import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { parseAngka, parseStatement, type BankKode, SUPPORTED_BANKS } from "@/lib/bank-parsers";
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
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Ukuran file maksimal 5 MB" }, { status: 400 });
    const bankKode: BankKode = (SUPPORTED_BANKS as readonly string[]).includes(bank) ? bank : "generic";

    const account = await prisma.account.findUnique({ where: { id: accountId }, select: { nama: true } });
    if (!account) return NextResponse.json({ error: "Rekening tidak ditemukan" }, { status: 404 });
    if (bankKode !== "generic" && !account.nama.toLowerCase().includes(bankKode)) {
      return NextResponse.json({ error: `Format ${bankKode.toUpperCase()} tidak sesuai dengan rekening ${account.nama}.` }, { status: 400 });
    }

    const text = await file.text();
    const parsed = parseStatement(bankKode, text);
    if (parsed.lines.length === 0) {
      return NextResponse.json({ error: "Tidak ada baris mutasi yang bisa dibaca dari file ini." }, { status: 400 });
    }

    const tgls = parsed.lines.map((l) => l.tanggal.getTime());
    const periodeAwal = new Date(Math.min(...tgls));
    const periodeAkhir = new Date(Math.max(...tgls));
    const angkaForm = (key: string) => {
      const raw = String(form.get(key) ?? "").trim();
      return raw && /\d/.test(raw) ? parseAngka(raw) : null;
    };
    const saldoAwalInput = angkaForm("saldoAwal");
    const saldoAkhirInput = angkaForm("saldoAkhir");
    // Bila saldo tidak diisi, gunakan kolom saldo pada baris (bila ada).
    const saldoAwal = saldoAwalInput ?? (parsed.lines[0].saldo != null ? parsed.lines[0].saldo - (parsed.lines[0].kredit - parsed.lines[0].debit) : null);
    const saldoAkhir = saldoAkhirInput ?? parsed.lines[parsed.lines.length - 1].saldo ?? null;
    if (saldoAwal == null || saldoAkhir == null) {
      return NextResponse.json({
        error: "Saldo awal dan saldo akhir tidak ditemukan di file. Isi keduanya secara manual agar hasil rekonsiliasi dapat divalidasi.",
      }, { status: 400 });
    }

    const movement = parsed.lines.reduce((sum, line) => sum + line.kredit - line.debit, 0);
    const selisih = Math.round((saldoAkhir - (saldoAwal + movement)) * 100) / 100;
    if (Math.abs(selisih) > 1) {
      return NextResponse.json({
        error: `Mutasi tidak konsisten dengan saldo (selisih ${selisih.toLocaleString("id-ID")}). Periksa format bank, saldo awal/akhir, dan file yang diunggah.`,
        diagnostics: { saldoAwal, saldoAkhir, movement, selisih, terparse: parsed.terparse, totalBaris: parsed.totalBaris },
      }, { status: 422 });
    }

    const namaFile = `${bankKode.toUpperCase()} · ${file.name}`;
    const duplicate = await prisma.bankStatement.findFirst({
      where: { accountId, namaFile, periodeAwal, periodeAkhir, saldoAwal, saldoAkhir },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json({ error: "File dengan periode dan saldo yang sama sudah pernah diimpor.", id: duplicate.id }, { status: 409 });
    }

    const statement = await prisma.$transaction(async (db) => {
      const st = await db.bankStatement.create({
        data: {
          accountId,
          periodeAwal,
          periodeAkhir,
          saldoAwal,
          saldoAkhir,
          namaFile,
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
