import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type { SunriseResponse, SunriseData } from "@/lib/types/sunrise";

const cache = new Map<string, { data: SunriseData; fetchedAt: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function parseCoord(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function key(lat: number, lon: number, date: string) {
  return `${lat.toFixed(4)},${lon.toFixed(4)}@${date}`;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const latParam = parseCoord(params.get("lat"));
  const lonParam = parseCoord(params.get("lon"));
  const lat = latParam ?? config.location.lat;
  const lon = lonParam ?? config.location.lon;

  const today = new Date().toISOString().split("T")[0];
  const cacheKey = key(lat, lon, today);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const url = `https://api.met.no/weatherapi/sunrise/3.0/sun?lat=${lat}&lon=${lon}&date=${today}&offset=+01:00`;
    const res = await fetchWithTimeout(url, {
      headers: { "User-Agent": `infoskjerm/1.0 ${config.metContact}` },
    });
    if (!res.ok) throw new Error(`Sunrise API ${res.status}`);

    const raw: SunriseResponse = await res.json();
    const format = (iso: string) =>
      new Date(iso).toLocaleTimeString("no-NO", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Oslo",
      });

    const data: SunriseData = {
      sunrise: format(raw.properties.sunrise.time),
      sunset: format(raw.properties.sunset.time),
    };

    cache.set(cacheKey, { data, fetchedAt: Date.now() });
    return NextResponse.json(data);
  } catch {
    if (cached) return NextResponse.json(cached.data);
    return NextResponse.json({ error: "Kunne ikke hente soldata" }, { status: 503 });
  }
}
