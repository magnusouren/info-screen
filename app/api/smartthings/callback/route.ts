import { NextResponse, type NextRequest } from "next/server";
import {
  exchangeCodeForTokens,
  OAUTH_STATE_COOKIE,
} from "@/lib/smartthingsAuth";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.json(
      { error: "Ugyldig OAuth-forespørsel" },
      { status: 400 }
    );
  }

  try {
    await exchangeCodeForTokens(code);
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke veksle inn kode mot SmartThings" },
      { status: 502 }
    );
  }

  const res = NextResponse.redirect(new URL("/", request.url));
  res.cookies.delete(OAUTH_STATE_COOKIE);
  return res;
}
