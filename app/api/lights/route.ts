import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";
import { getAccessToken } from "@/lib/smartthingsAuth";
import type { Light, LightRoom, LightsData } from "@/lib/types/lights";

const API_BASE = "https://api.smartthings.com/v1";
const CONNECT_URL = "/api/smartthings/authorize";

// Capabilities that rule a device out even though it has `switch` —
// TVs, media players, sensors and buttons all expose `switch` on SmartThings
// but aren't lights we want on the lights page.
const NON_LIGHT_CAPS = new Set([
  "tvChannel",
  "mediaPlayback",
  "mediaTrackControl",
  "mediaInputSource",
  "mediaGroup",
  "mediaPresets",
  "audioVolume",
  "audioMute",
  "audioNotification",
  "audioTrackData",
  "contactSensor",
  "button",
  "presenceSensor",
  "bridge",
  "illuminanceMeasurement",
  "relativeBrightness",
  "knob",
]);

interface SmartThingsDevice {
  deviceId: string;
  label?: string;
  name?: string;
  roomId?: string;
  components?: { capabilities?: { id: string }[] }[];
}

interface DeviceStatus {
  components?: {
    main?: {
      switch?: { switch?: { value?: string } };
      switchLevel?: { level?: { value?: number } };
    };
  };
}

function deviceCapabilities(device: SmartThingsDevice): Set<string> {
  const caps = new Set<string>();
  for (const component of device.components ?? []) {
    for (const cap of component.capabilities ?? []) caps.add(cap.id);
  }
  return caps;
}

function isLight(device: SmartThingsDevice): boolean {
  const caps = deviceCapabilities(device);
  if (!caps.has("switch")) return false;
  for (const bad of NON_LIGHT_CAPS) if (caps.has(bad)) return false;
  return true;
}

async function fetchLights(token: string): Promise<LightsData> {
  const headers = { Authorization: `Bearer ${token}` };

  const devicesRes = await fetch(`${API_BASE}/devices`, {
    headers,
    cache: "no-store",
  });
  if (!devicesRes.ok) throw new Error(`SmartThings svarte ${devicesRes.status}`);
  const devicesJson = (await devicesRes.json()) as { items?: SmartThingsDevice[] };
  const lightDevices = (devicesJson.items ?? []).filter(isLight);

  const lights: (Light & { roomId: string | null })[] = await Promise.all(
    lightDevices.map(async (device) => {
      const statusRes = await fetch(
        `${API_BASE}/devices/${device.deviceId}/status`,
        { headers, cache: "no-store" }
      );
      const status: DeviceStatus | null = statusRes.ok
        ? await statusRes.json()
        : null;
      const main = status?.components?.main;
      return {
        id: device.deviceId,
        label: device.label ?? device.name ?? "Ukjent lys",
        switch: main?.switch?.switch?.value === "on" ? "on" : "off",
        level: main?.switchLevel?.level?.value ?? null,
        roomId: device.roomId ?? null,
      };
    })
  );

  const roomNames = config.smartThings.rooms;
  const rooms = new Map<string, LightRoom>();
  for (const roomId of Object.keys(roomNames)) {
    rooms.set(roomId, { id: roomId, name: roomNames[roomId], lights: [] });
  }

  for (const { roomId, ...light } of lights) {
    const key = roomId ?? "unknown";
    if (!rooms.has(key)) {
      rooms.set(key, { id: key, name: "Annet", lights: [] });
    }
    rooms.get(key)!.lights.push(light);
  }

  return [...rooms.values()].filter((room) => room.lights.length > 0);
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
    const data = await fetchLights(token);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke hente lys fra SmartThings" },
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

  let body: { deviceId?: string; switch?: "on" | "off"; level?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  if (!body.deviceId) {
    return NextResponse.json({ error: "Mangler deviceId" }, { status: 400 });
  }

  const commands: Record<string, unknown>[] = [];
  if (body.switch === "on" || body.switch === "off") {
    commands.push({ component: "main", capability: "switch", command: body.switch });
  }
  if (typeof body.level === "number" && Number.isFinite(body.level)) {
    const level = Math.max(1, Math.min(100, Math.round(body.level)));
    commands.push({
      component: "main",
      capability: "switchLevel",
      command: "setLevel",
      arguments: [level],
    });
  }
  if (commands.length === 0) {
    return NextResponse.json({ error: "Ingen kommando å utføre" }, { status: 400 });
  }

  const res = await fetch(`${API_BASE}/devices/${body.deviceId}/commands`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ commands }),
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Kunne ikke styre lyset" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
