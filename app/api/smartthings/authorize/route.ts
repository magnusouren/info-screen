import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  buildAuthorizeUrl,
  smartThingsConfigured,
  OAUTH_STATE_COOKIE,
} from "@/lib/smartthingsAuth";

export async function GET() {
  if (!smartThingsConfigured()) {
    return NextResponse.json(
      { error: "SmartThings OAuth er ikke konfigurert" },
      { status: 503 }
    );
  }

  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(buildAuthorizeUrl(state));
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
