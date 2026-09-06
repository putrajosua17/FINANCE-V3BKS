import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { canAccess } from "@/lib/access";

const SESSION_COOKIE = "v3bks_session";
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/setup"];

async function isValid(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const configured = process.env.AUTH_SECRET;
    if (!configured && process.env.NODE_ENV === "production") return null;
    const secret = new TextEncoder().encode(configured || "dev-only-secret-change-me");
    const { payload } = await jwtVerify(token, secret);
    return String(payload.role || "");
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const authed = await isValid(token);
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!authed && !isPublic) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Session berakhir. Silakan masuk kembali." }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (authed && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = authed === "admin" ? "/lapangan" : "/dashboard";
    return NextResponse.redirect(url);
  }

  if (authed && !isPublic && !canAccess(authed, pathname, req.method)) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403 });
    return NextResponse.redirect(new URL(authed === "admin" ? "/lapangan" : "/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Lindungi semua kecuali aset statis & _next
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
