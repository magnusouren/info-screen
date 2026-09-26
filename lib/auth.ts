import { createHmac, timingSafeEqual } from "crypto";
import { dashboardPassword } from "./env";

export const AUTH_COOKIE = "infoskjerm_auth";

function sign(): string {
  return createHmac("sha256", dashboardPassword)
    .update("authenticated")
    .digest("hex");
}

export function createAuthCookieValue(): string {
  return sign();
}

export function isValidAuthCookie(value: string | undefined): boolean {
  if (!value || !dashboardPassword) return false;
  const expected = Buffer.from(sign());
  const actual = Buffer.from(value);
  return (
    expected.length === actual.length && timingSafeEqual(expected, actual)
  );
}
