import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, setTokenCookie } from "@/lib/auth";

const FRONTEND_URL = process.env.NODE_ENV === "production"
  ? (process.env.FRONTEND_URL_PROD ?? "http://localhost:3000")
  : (process.env.FRONTEND_URL_LOCAL ?? "http://localhost:3000");

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(`${FRONTEND_URL}/login?error=auth_failed`);

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.NODE_ENV === "production"
        ? process.env.GOOGLE_CALLBACK_URL_PROD!
        : process.env.GOOGLE_CALLBACK_URL_LOCAL!,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) return NextResponse.redirect(`${FRONTEND_URL}/login?error=auth_failed`);

  const { id_token } = await tokenRes.json();

  // Decode the id_token (no verify needed — came directly from Google over TLS)
  const [, payloadB64] = id_token.split(".");
  const googleUser = JSON.parse(
    Buffer.from(payloadB64, "base64url").toString()
  ) as { sub: string; email: string; name: string; picture?: string };

  const user = await prisma.user.upsert({
    where: { googleId: googleUser.sub },
    update: { email: googleUser.email, name: googleUser.name, avatarUrl: googleUser.picture },
    create: {
      googleId: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.picture,
    },
  });

  const token = await signToken({ sub: user.id, email: user.email });
  const response = NextResponse.redirect(`${FRONTEND_URL}/dictation`);
  setTokenCookie(token, response);
  return response;
}
