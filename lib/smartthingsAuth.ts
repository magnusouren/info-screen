import {
  smartThingsClientId,
  smartThingsClientSecret,
  smartThingsRedirectUri,
} from "./env";
import { redis } from "./redis";

const TOKEN_URL = "https://api.smartthings.com/oauth/token";
const AUTHORIZE_URL = "https://api.smartthings.com/oauth/authorize";
const TOKENS_KEY = "smartthings:tokens";
const SCOPES = "r:scenes:* x:scenes:* r:devices:* x:devices:*";

export const OAUTH_STATE_COOKIE = "smartthings_oauth_state";

// Refresh a bit before actual expiry so we never hand out a stale token.
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // ms epoch
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

function basicAuthHeader(): string {
  return (
    "Basic " +
    Buffer.from(`${smartThingsClientId}:${smartThingsClientSecret}`).toString(
      "base64"
    )
  );
}

async function requestToken(body: URLSearchParams): Promise<StoredTokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`SmartThings token-endepunkt svarte ${res.status}`);
  }
  const json = (await res.json()) as TokenResponse;
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: smartThingsClientId,
    scope: SCOPES,
    response_type: "code",
    redirect_uri: smartThingsRedirectUri,
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  if (!redis) throw new Error("Redis er ikke konfigurert");
  const tokens = await requestToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: smartThingsRedirectUri,
    })
  );
  await redis.set(TOKENS_KEY, tokens);
}

async function refresh(current: StoredTokens): Promise<StoredTokens> {
  const tokens = await requestToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: current.refreshToken,
    })
  );
  await redis!.set(TOKENS_KEY, tokens);
  return tokens;
}

export function smartThingsConfigured(): boolean {
  return !!(
    smartThingsClientId &&
    smartThingsClientSecret &&
    smartThingsRedirectUri &&
    redis
  );
}

// Returns null when SmartThings hasn't been connected yet (no tokens stored),
// so the caller can point the user at buildAuthorizeUrl().
export async function getAccessToken(): Promise<string | null> {
  if (!smartThingsConfigured()) return null;
  const stored = await redis!.get<StoredTokens>(TOKENS_KEY);
  if (!stored) return null;

  if (Date.now() < stored.expiresAt - EXPIRY_BUFFER_MS) {
    return stored.accessToken;
  }
  const refreshed = await refresh(stored);
  return refreshed.accessToken;
}
