import { NextResponse, type NextRequest } from "next/server";
import { isValidShortcutsToken } from "@/lib/auth";
import { getAccessToken } from "@/lib/smartthingsAuth";
import { executeScene, fetchScenes } from "@/lib/smartthingsScenes";

// Endepunkt for iOS Snarveier: list og kjør SmartThings-scener uten
// innloggings-cookie. Beskyttet av SHORTCUTS_TOKEN (Authorization: Bearer …).
//
//   GET  /api/shortcuts/scenes                 → ["God morgen", "Kveld", …]
//   POST /api/shortcuts/scenes {"name":"Kveld"} → { ok: true, scene: "Kveld" }
//
// `name` kan også sendes som ?name=… i URL-en. Navnet matches uten hensyn
// til store/små bokstaver.

const NO_STORE = { "Cache-Control": "no-store" };

function error(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status, headers: NO_STORE });
}

async function authorize(request: NextRequest) {
  if (!isValidShortcutsToken(request.headers.get("authorization"))) {
    return { response: error("Ugyldig eller manglende token", 401) };
  }
  const token = await getAccessToken();
  if (!token) return { response: error("SmartThings er ikke tilkoblet", 503) };
  return { token };
}

export async function GET(request: NextRequest) {
  const auth = await authorize(request);
  if (!auth.token) return auth.response;

  try {
    const scenes = await fetchScenes(auth.token);
    return NextResponse.json(
      scenes.map((s) => s.name),
      { headers: NO_STORE },
    );
  } catch {
    return error("Kunne ikke hente scener fra SmartThings", 502);
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorize(request);
  if (!auth.token) return auth.response;

  let name = request.nextUrl.searchParams.get("name");
  if (!name) {
    const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
    if (typeof body?.name === "string") name = body.name;
  }
  name = name?.trim() ?? "";
  if (!name) return error("Mangler scenenavn (name)", 400);

  let scenes;
  try {
    scenes = await fetchScenes(auth.token);
  } catch {
    return error("Kunne ikke hente scener fra SmartThings", 502);
  }

  const scene = scenes.find((s) => s.name.toLowerCase() === name.toLowerCase());
  if (!scene) {
    return error(
      `Fant ingen scene som heter «${name}». Tilgjengelige: ${scenes.map((s) => s.name).join(", ")}`,
      404,
    );
  }

  try {
    await executeScene(auth.token, scene.id);
  } catch {
    return error(`Kunne ikke kjøre «${scene.name}»`, 502);
  }

  return NextResponse.json({ ok: true, scene: scene.name }, { headers: NO_STORE });
}
