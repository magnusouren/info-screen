import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";
import { fetchNearbyStops } from "@/lib/entur";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=20, stale-while-revalidate=30",
};
const ERROR_HEADERS = { "Cache-Control": "no-store" };

function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.max(Math.floor(n), min), max);
}

export async function GET(request: NextRequest) {
  const latRaw = request.nextUrl.searchParams.get("lat");
  const lonRaw = request.nextUrl.searchParams.get("lon");
  const latParam = latRaw !== null && latRaw !== "" ? Number(latRaw) : NaN;
  const lonParam = lonRaw !== null && lonRaw !== "" ? Number(lonRaw) : NaN;
  const lat = Number.isFinite(latParam) ? latParam : config.location.lat;
  const lon = Number.isFinite(lonParam) ? lonParam : config.location.lon;

  const radius = clampInt(request.nextUrl.searchParams.get("radius"), 800, 100, 2000);
  const maxStops = clampInt(request.nextUrl.searchParams.get("maxStops"), 5, 1, 8);
  const count = clampInt(request.nextUrl.searchParams.get("count"), 5, 1, 20);

  try {
    const stops = await fetchNearbyStops(lat, lon, {
      radius,
      maxStops,
      departuresPerStop: count,
    });

    if (stops.length === 0) {
      return NextResponse.json(
        { error: "Ingen stoppesteder i nærheten" },
        { status: 503, headers: ERROR_HEADERS }
      );
    }

    return NextResponse.json(stops, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke hente stoppesteder i nærheten" },
      { status: 503, headers: ERROR_HEADERS }
    );
  }
}
