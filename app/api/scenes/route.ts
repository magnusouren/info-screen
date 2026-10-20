import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { getAccessToken } from "@/lib/smartthingsAuth";
import type { Scene, SceneIcon, ScenesData } from "@/lib/types/scenes";

const API_BASE = "https://api.smartthings.com/v1";
const DEFAULT_ICON: SceneIcon = "power";
const CACHE_TTL = 60 * 1000;
const CONNECT_URL = "/api/smartthings/authorize";

function toIcon(name: string): SceneIcon {
  const mapped = config.smartThings.sceneIcons[name];
  return (mapped as SceneIcon | undefined) ?? DEFAULT_ICON;
}

let cachedScenes: { scenes: Scene[]; at: number } | null = null;

async function fetchScenes(token: string): Promise<Scene[]> {
  const res = await fetchWithTimeout(`${API_BASE}/scenes`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`SmartThings svarte ${res.status}`);
  const json = (await res.json()) as {
    items?: { sceneId: string; sceneName: string }[];
  };
  return (json.items ?? []).map((item) => ({
    id: item.sceneId,
    name: item.sceneName,
    icon: toIcon(item.sceneName),
  }));
}

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
    const res = await fetchWithTimeout(`${API_BASE}/scenes/${id}/execute`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error();
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke aktivere scenen" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
