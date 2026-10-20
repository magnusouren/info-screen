import { NextResponse, type NextRequest } from "next/server";
import { fetchTrip } from "@/lib/entur";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30",
};
const ERROR_HEADERS = { "Cache-Control": "no-store" };

function parseFloatParam(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const fromLat = parseFloatParam(params.get("fromLat"));
  const fromLon = parseFloatParam(params.get("fromLon"));
  const toLat = parseFloatParam(params.get("toLat"));
  const toLon = parseFloatParam(params.get("toLon"));
  const toName = params.get("toName") ?? "Destinasjon";

  if (fromLat === null || fromLon === null || toLat === null || toLon === null) {
    return NextResponse.json(
      { error: "Mangler fromLat/fromLon/toLat/toLon" },
      { status: 400, headers: ERROR_HEADERS }
    );
  }

  try {
    const patterns = await fetchTrip(
      { lat: fromLat, lon: fromLon, name: "Her" },
      { lat: toLat, lon: toLon, name: toName },
      5
    );

    // An empty array is a legitimate result (e.g. nothing meaningful to
    // show when you're already basically there) — not an error.
    return NextResponse.json(patterns, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke hente reiseforslag" },
      { status: 503, headers: ERROR_HEADERS }
    );
  }
}
