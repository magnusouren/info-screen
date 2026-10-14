import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";
import { fetchNearestStations } from "@/lib/citybike";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=20, stale-while-revalidate=30",
};
const ERROR_HEADERS = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const latParam = Number(request.nextUrl.searchParams.get("lat"));
  const lonParam = Number(request.nextUrl.searchParams.get("lon"));
  const lat = Number.isFinite(latParam) ? latParam : config.location.lat;
  const lon = Number.isFinite(lonParam) ? lonParam : config.location.lon;

  const limitParam = Number(request.nextUrl.searchParams.get("limit"));
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(Math.floor(limitParam), 10)
      : 1;

  try {
    const stations = await fetchNearestStations(lat, lon, limit);
    if (stations.length === 0) {
      return NextResponse.json(
        { error: "Ingen bysykkelstasjoner funnet" },
        { status: 503, headers: ERROR_HEADERS }
      );
    }
    return NextResponse.json(stations, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke hente bysykkeldata" },
      { status: 503, headers: ERROR_HEADERS }
    );
  }
}
