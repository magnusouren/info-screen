import { NextResponse, type NextRequest } from "next/server";
import { getAccessToken } from "@/lib/smartthingsAuth";
import { executeScene, fetchScenes } from "@/lib/smartthingsScenes";
import type { Scene, ScenesData } from "@/lib/types/scenes";

const CACHE_TTL = 60 * 1000;
const CONNECT_URL = "/api/smartthings/authorize";

let cachedScenes: { scenes: Scene[]; at: number } | null = null;

export async function GET() {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json(
      { error: "SmartThings er ikke tilkoblet", connectUrl: CONNECT_URL },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    if (!cachedScenes || Date.now() - cachedScenes.at > CACHE_TTL) {
      cachedScenes = { scenes: await fetchScenes(token), at: Date.now() };
    }
    const data: ScenesData = { scenes: cachedScenes.scenes };
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke hente scener fra SmartThings" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(request: NextRequest) {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json(
      { error: "SmartThings er ikke tilkoblet", connectUrl: CONNECT_URL },
      { status: 503 }
    );
  }

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const id = body?.id;
  if (!id) {
    return NextResponse.json({ error: "Mangler id" }, { status: 400 });
  }

  try {
    await executeScene(token, id);
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke aktivere scenen" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
