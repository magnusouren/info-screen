import { NextResponse, type NextRequest } from "next/server";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};
const ERROR_HEADERS = { "Cache-Control": "no-store" };

interface GeocoderFeature {
  properties?: {
    id?: string;
    name?: string;
    locality?: string;
    label?: string;
    category?: string[];
  };
}

interface GeocoderResponse {
  features?: GeocoderFeature[];
}

export interface StopSearchResult {
  id: string;
  name: string;
  locality: string;
  label: string;
  categories: string[];
}

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] }, { headers: CACHE_HEADERS });
  }

  try {
    const url = `https://api.entur.io/geocoder/v1/autocomplete?text=${encodeURIComponent(q)}&lang=no&size=10&layers=venue`;
    const res = await fetchWithTimeout(url, {
      headers: { "ET-Client-Name": "infoskjerm-privat" },
    });
    if (!res.ok) throw new Error(`Entur ${res.status}`);

    const raw = (await res.json()) as GeocoderResponse;
    const results: StopSearchResult[] = (raw.features ?? [])
      .map((f) => f.properties)
      .filter((p): p is NonNullable<GeocoderFeature["properties"]> => !!p?.id && !!p?.name)
      .map((p) => ({
        id: p.id!,
        name: p.name!,
        locality: p.locality ?? "",
        label: p.label ?? p.name!,
        categories: p.category ?? [],
      }));

    return NextResponse.json({ results }, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke søke" },
      { status: 503, headers: ERROR_HEADERS }
    );
  }
}
