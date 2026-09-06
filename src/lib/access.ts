export const isFinance = (role: string) => role === "finance" || role === "owner";
export function canAccess(role: string, path: string, method = "GET") {
  if (role === "owner") return true;
  if (path.startsWith("/api/users")) return false;
  if (isFinance(role)) return true;
  if (role !== "admin") return false;
  if (path.startsWith("/api/")) {
    if (path === "/api/auth/logout") return true;
    if (/^\/api\/(imports|operations|evidence)(\/|$)/.test(path)) return true;
    if (path === "/api/tutup-kas" && ["POST", "GET"].includes(method)) return true;
    return false;
  }
  return ["/lapangan", "/transaksi/impor", "/pembayaran", "/operasional", "/tutup-kas", "/panduan"].some(p => path === p || path.startsWith(p + "/"));
}
