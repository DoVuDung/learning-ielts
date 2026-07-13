import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/login", "/api/auth", "/auth"];
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const token = request.cookies.get("access_token")?.value;

  const isValid = token
    ? await jwtVerify(token, secret).then(() => true).catch(() => false)
    : false;

  if (!isPublic && !isValid) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && isValid) {
    return NextResponse.redirect(new URL("/dictation", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
