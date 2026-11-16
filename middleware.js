import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req) {
  const token = req.cookies.get("sakoon_session")?.value;
  let role = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
      role = payload.role;
    } catch {}
  }
  const valid = !!role;
  const { pathname } = req.nextUrl;
  const protectedPath = ["/dashboard", "/admin", "/psychologist"].some((p) => pathname.startsWith(p));

  if (protectedPath && !valid) return NextResponse.redirect(new URL("/login", req.url));
  // First line of defence only; every page and action re-checks the role against the database.
  if (pathname.startsWith("/admin") && role !== "admin")
    return NextResponse.redirect(new URL("/dashboard", req.url));
  if (pathname.startsWith("/psychologist") && role !== "psychologist")
    return NextResponse.redirect(new URL("/dashboard", req.url));
  if ((pathname === "/login" || pathname === "/register") && valid)
    return NextResponse.redirect(new URL("/dashboard", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/psychologist/:path*", "/login", "/register"],
};
