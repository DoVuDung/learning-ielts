import { NextResponse } from "next/server";

const CALLBACK_URL = process.env.NODE_ENV === "production"
  ? process.env.GOOGLE_CALLBACK_URL_PROD!
  : process.env.GOOGLE_CALLBACK_URL_LOCAL!;

export function GET() {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: CALLBACK_URL,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );
}
