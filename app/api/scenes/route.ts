import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";
import { smartThingsToken } from "@/lib/env";
import type { Scene, SceneIcon, ScenesData } from "@/lib/types/scenes";

const API_BASE = "https://api.smartthings.com/v1";
const DEFAULT_ICON: SceneIcon = "power";
const CACHE_TTL = 60 * 1000;

function toIcon(name: string): SceneIcon {
  const mapped = config.smartThings.sceneIcons[name];
  return (mapped as SceneIcon | undefined) ?? DEFAULT_ICON;
}

let cachedScenes: { scenes: Scene[]; at: number } | null = null;
let activeId: string | null = null;

async function fetchScenes(): Promise<Scene[]> {
  const res = await fetch(`${API_BASE}/scenes`, {
    headers: { Authorization: `Bearer ${smartThingsToken}` },
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
  if (!smartThingsToken) {
    return NextResponse.json(
      { error: "SMARTTHINGS_TOKEN er ikke satt" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    if (!cachedScenes || Date.now() - cachedScenes.at > CACHE_TTL) {
      cachedScenes = { scenes: await fetchScenes(), at: Date.now() };
    }
    const data: ScenesData = { scenes: cachedScenes.scenes, activeId };
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
  if (!smartThingsToken) {
    return NextResponse.json(
      { error: "SMARTTHINGS_TOKEN er ikke satt" },
      { status: 503 }
    );
  }

  let body: { id?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const requestedId = body?.id ?? null;
  const scenes = cachedScenes?.scenes ?? [];
  if (requestedId !== null && !scenes.some((s) => s.id === requestedId)) {
    return NextResponse.json({ error: "Ukjent scene" }, { status: 400 });
  }

  if (requestedId) {
    const res = await fetch(`${API_BASE}/scenes/${requestedId}/execute`, {
      method: "POST",
      headers: { Authorization: `Bearer ${smartThingsToken}` },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Kunne ikke aktivere scenen" },
        { status: 502 }
      );
    }
  }

  activeId = requestedId;
  const data: ScenesData = { scenes, activeId };
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
