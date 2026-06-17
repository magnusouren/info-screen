import { NextResponse, type NextRequest } from "next/server";
import type { Scene, ScenesData } from "@/lib/types/scenes";

// Mock state inntil ekte smarthus-integrasjon er på plass.
// Når Home Assistant / Hue / lignende kobles til:
//   - Bytt SCENES med scenene fra det aktuelle systemet (eller hent dem dynamisk)
//   - I GET/POST: les/skriv mot det systemets API i stedet for variabelen state.
// Klienten leser /api/scenes og endrer ingenting.
const SCENES: Scene[] = [
  { id: "av", name: "Av", icon: "power" },
  { id: "daglys", name: "Daglys", icon: "lightbulb" },
  { id: "kveld", name: "Kveld", icon: "moonstars" },
  { id: "film", name: "Film", icon: "filmreel" },
  { id: "vasking", name: "Vasking", icon: "broom" },
  { id: "middag", name: "Middag", icon: "forkknife" },
];

const state: { activeId: string | null } = { activeId: null };

export async function GET() {
  const data: ScenesData = { scenes: SCENES, activeId: state.activeId };
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  let body: { id?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const requestedId = body?.id ?? null;
  if (requestedId !== null && !SCENES.some((s) => s.id === requestedId)) {
    return NextResponse.json({ error: "Ukjent scene" }, { status: 400 });
  }

  state.activeId = requestedId;
  const data: ScenesData = { scenes: SCENES, activeId: state.activeId };
  return NextResponse.json(data);
}
