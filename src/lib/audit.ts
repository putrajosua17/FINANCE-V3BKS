import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";

type AuditExtra = {
  nilaiLama?: unknown;
  nilaiBaru?: unknown;
  ipAddress?: string | null;
};

// Catat aktivitas ke audit log. Tidak pernah melempar error (best-effort).
// F-05: dapat menyimpan nilaiLama/nilaiBaru agar perubahan bisa direkonstruksi.
export async function logAudit(
  user: SessionUser | null,
  aksi: string,
  entitas: string,
  detail?: string,
  extra?: AuditExtra
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: user?.id ?? null,
        userName: user?.nama ?? "Sistem",
        aksi,
        entitas,
        detail: detail ?? null,
        nilaiLama: extra?.nilaiLama === undefined ? undefined : (extra.nilaiLama as object),
        nilaiBaru: extra?.nilaiBaru === undefined ? undefined : (extra.nilaiBaru as object),
        ipAddress: extra?.ipAddress ?? null,
      },
    });
  } catch {
    // abaikan kegagalan audit agar tidak mengganggu operasi utama
  }
}
