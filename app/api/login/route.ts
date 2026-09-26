import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, createAuthCookieValue } from "@/lib/auth";
import { dashboardPassword } from "@/lib/env";

export async function POST(request: NextRequest) {
  if (!dashboardPassword) {
    return NextResponse.json(
      { error: "DASHBOARD_PASSWORD er ikke satt" },
      { status: 503 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  if (body.password !== dashboardPassword) {
    return NextResponse.json({ error: "Feil passord" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, createAuthCookieValue(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return res;
}
