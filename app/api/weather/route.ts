import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { userAgent } from "@/lib/env";
import type { WeatherResponse, WeatherData } from "@/lib/types/weather";

const weatherCache = new Map<string, { data: WeatherData; fetchedAt: number }>();
const nameCache = new Map<string, string>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
};
const ERROR_HEADERS = { "Cache-Control": "no-store" };

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
    return NextResponse.json(cached.data, { headers: CACHE_HEADERS });
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
    const fmtHour = (iso: string) =>
      new Date(iso).toLocaleTimeString("no-NO", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Oslo",
      });

    const upcoming = timeseries.filter((t) => {
      const hoursAhead = (new Date(t.time).getTime() - now.getTime()) / 3600000;
      return hoursAhead >= 0 && hoursAhead <= 24;
    });

    const next10 = upcoming.slice(0, 10).map((t) => ({
      hour: fmtHour(t.time),
      amount: t.data.next_1_hours?.details.precipitation_amount ?? 0,
    }));

    const hourly = upcoming
      .filter((t) => t.data.next_1_hours)
      .slice(0, 24)
      .map((t) => ({
        time: t.time,
        hour: fmtHour(t.time),
        symbolCode: t.data.next_1_hours?.summary.symbol_code ?? "cloudy",
        temperature: Math.round(t.data.instant.details.air_temperature),
        windSpeed: Math.round(t.data.instant.details.wind_speed),
        precipitation: t.data.next_1_hours?.details.precipitation_amount ?? 0,
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
      hourly,
    };

    weatherCache.set(key, { data, fetchedAt: Date.now() });
    return NextResponse.json(data, { headers: CACHE_HEADERS });
  } catch {
    if (cached) return NextResponse.json(cached.data, { headers: CACHE_HEADERS });
    return NextResponse.json(
      { error: "Kunne ikke hente værdata" },
      { status: 503, headers: ERROR_HEADERS }
    );
  }
}
