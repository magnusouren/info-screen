import { NextResponse, type NextRequest } from "next/server";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type { PlaceSearchResult } from "@/lib/types/trip";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};
const ERROR_HEADERS = { "Cache-Control": "no-store" };

interface GeocoderFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    id?: string;
    name?: string;
    label?: string;
  };
}

interface GeocoderResponse {
  features?: GeocoderFeature[];
}

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] }, { headers: CACHE_HEADERS });
  }

  try {
    const url = `https://api.entur.io/geocoder/v1/autocomplete?text=${encodeURIComponent(q)}&lang=no&size=10&layers=venue,address`;
    const res = await fetchWithTimeout(url, {
      headers: { "ET-Client-Name": "infoskjerm-privat" },
    });
    if (!res.ok) throw new Error(`Entur ${res.status}`);

    const raw = (await res.json()) as GeocoderResponse;
    const results: PlaceSearchResult[] = (raw.features ?? [])
      .map((f) => ({
        id: f.properties?.id,
        name: f.properties?.name,
        label: f.properties?.label ?? f.properties?.name,
        coordinates: f.geometry?.coordinates,
      }))
      .filter(
        (
          p
        ): p is { id: string; name: string; label: string; coordinates: [number, number] } =>
          !!p.id && !!p.name && !!p.label && !!p.coordinates
      )
      .map((p) => ({
        id: p.id,
        name: p.name,
        label: p.label,
        lon: p.coordinates[0],
        lat: p.coordinates[1],
      }));

    return NextResponse.json({ results }, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke søke" },
      { status: 503, headers: ERROR_HEADERS }
    );
  }
}
