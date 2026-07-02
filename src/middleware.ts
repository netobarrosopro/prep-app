import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/session";

// Rotas de páginas que exigem sessão autenticada (APIs validam individualmente)
const PROTECTED_PREFIXES = ["/dashboard", "/cars"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("session")?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload || payload.purpose !== "session") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/cars/:path*"],
};
