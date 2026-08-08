import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";

// Catat aktivitas ke audit log. Tidak pernah melempar error (best-effort).
export async function logAudit(
  user: SessionUser | null,
  aksi: string,
  entitas: string,
  detail?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: user?.id ?? null,
        userName: user?.nama ?? "Sistem",
        aksi,
        entitas,
        detail: detail ?? null,
      },
    });
  } catch {
    // abaikan kegagalan audit agar tidak mengganggu operasi utama
  }
}
