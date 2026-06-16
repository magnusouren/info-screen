import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type { WeatherResponse, WeatherData } from "@/lib/types/weather";

const weatherCache = new Map<string, { data: WeatherData; fetchedAt: number }>();
const nameCache = new Map<string, string>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const userAgent = `infoskjerm/1.0 ${config.metContact}`;

function parseCoord(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return n;
}

function coordKey(lat: number, lon: number) {
  // ~10m precision is more than enough for weather/name lookups
  return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const key = coordKey(lat, lon);
  const cached = nameCache.get(key);
  if (cached) return cached;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=14&accept-language=no`;
    const res = await fetchWithTimeout(url, {
      headers: { "User-Agent": userAgent, "Accept-Language": "no" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { address?: Record<string, string>; name?: string };
    const a = json.address ?? {};
    const name =
      a.neighbourhood ??
      a.suburb ??
      a.quarter ??
      a.city_district ??
      a.village ??
      a.town ??
      a.city ??
      a.municipality ??
      json.name ??
      null;
    if (name) nameCache.set(key, name);
    return name;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const latParam = parseCoord(params.get("lat"));
  const lonParam = parseCoord(params.get("lon"));

  const usingDefault = latParam === null || lonParam === null;
  const lat = usingDefault ? config.location.lat : latParam!;
  const lon = usingDefault ? config.location.lon : lonParam!;

  const key = coordKey(lat, lon);
  const cached = weatherCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;
    const res = await fetchWithTimeout(url, { headers: { "User-Agent": userAgent } });
    if (!res.ok) throw new Error(`MET API ${res.status}`);

    const raw: WeatherResponse = await res.json();
    const timeseries = raw.properties.timeseries;

    const current = timeseries[0];
    const details = current.data.instant.details;
    const symbolCode =
      current.data.next_1_hours?.summary.symbol_code ??
      current.data.next_6_hours?.summary.symbol_code ??
      "cloudy";

    const now = new Date();
    const next10 = timeseries
      .filter((t) => {
        const time = new Date(t.time);
        const hoursAhead = (time.getTime() - now.getTime()) / 3600000;
        return hoursAhead >= 0 && hoursAhead <= 10;
      })
      .slice(0, 10)
      .map((t) => ({
        hour: new Date(t.time).toLocaleTimeString("no-NO", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Oslo",
        }),
        amount: t.data.next_1_hours?.details.precipitation_amount ?? 0,
      }));

    const geocoded = usingDefault ? null : await reverseGeocode(lat, lon);
    const locationName = geocoded ?? config.location.name;

    const data: WeatherData = {
      temperature: Math.round(details.air_temperature),
      symbolCode,
      windSpeed: Math.round(details.wind_speed),
      humidity: Math.round(details.relative_humidity),
      precipitation: next10,
      locationName,
    };

    weatherCache.set(key, { data, fetchedAt: Date.now() });
    return NextResponse.json(data);
  } catch {
    if (cached) return NextResponse.json(cached.data);
    return NextResponse.json({ error: "Kunne ikke hente værdata" }, { status: 503 });
  }
}
