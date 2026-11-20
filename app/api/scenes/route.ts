import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { getAccessToken } from "@/lib/smartthingsAuth";
import { adaptiveTarget, curveForScene } from "@/lib/adaptiveLighting";
import { applyToLightsThatAreOn } from "@/lib/smartthingsLights";
import type { Scene, SceneIcon, ScenesData } from "@/lib/types/scenes";

const API_BASE = "https://api.smartthings.com/v1";
const DEFAULT_ICON: SceneIcon = "power";
const CACHE_TTL = 60 * 1000;
const CONNECT_URL = "/api/smartthings/authorize";
/**
 * Hvor lenge vi venter etter at en adaptiv scene er kjørt før vi leser hvilke
 * lys som er på — SmartThings utfører scenen asynkront.
 */
const ADAPTIVE_SETTLE_MS = 1500;

function toIcon(name: string): SceneIcon {
  const mapped = config.smartThings.sceneIcons[name];
  return (mapped as SceneIcon | undefined) ?? DEFAULT_ICON;
}

let cachedScenes: { scenes: Scene[]; at: number } | null = null;

async function getScenes(token: string): Promise<Scene[]> {
  if (!cachedScenes || Date.now() - cachedScenes.at > CACHE_TTL) {
    cachedScenes = { scenes: await fetchScenes(token), at: Date.now() };
  }
  return cachedScenes.scenes;
}

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
    const data: ScenesData = { scenes: await getScenes(token) };
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

  // Adaptive scener: juster styrke og fargetemperatur etter tid på døgnet.
  // Best effort — scenen er allerede aktivert, så feil her gir ikke 502.
  try {
    const scene = (await getScenes(token)).find((s) => s.id === id);
    const curve = scene ? curveForScene(scene.name) : null;
    const target = curve ? adaptiveTarget(curve, new Date()) : null;
    if (target) {
      await new Promise((r) => setTimeout(r, ADAPTIVE_SETTLE_MS));
      await applyToLightsThatAreOn(token, target);
    }
  } catch {
    // Ignorer — scenen kjørte uansett.
  }

  return NextResponse.json({ ok: true });
}
