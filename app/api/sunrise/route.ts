import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type { SunriseResponse, SunriseData } from "@/lib/types/sunrise";

let cache: { data: SunriseData; fetchedAt: number } | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const { lat, lon } = config.location;
    const today = new Date().toISOString().split("T")[0];
    const url = `https://api.met.no/weatherapi/sunrise/3.0/sun?lat=${lat}&lon=${lon}&date=${today}&offset=+01:00`;

    const res = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": `infoskjerm/1.0 ${config.metContact}`,
      },
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

    cache = { data, fetchedAt: Date.now() };
    return NextResponse.json(data);
  } catch {
    if (cache) return NextResponse.json(cache.data);
    return NextResponse.json({ error: "Kunne ikke hente soldata" }, { status: 503 });
  }
}
