import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type { WeatherResponse, WeatherData } from "@/lib/types/weather";
import type { SunriseResponse, SunriseData } from "@/lib/types/sunrise";
import type { PricesResponse, PricesData } from "@/lib/types/prices";
import type { StopPlaceResponse, BusData, StopDepartures } from "@/lib/types/bus";
import type { NewsData } from "@/lib/types/news";

import type { DashboardData } from "@/lib/types/dashboard";

// Per-module caches
const cache: {
  weather: { data: WeatherData; at: number } | null;
  sunrise: { data: SunriseData; at: number } | null;
  prices: { data: PricesData; at: number } | null;
  news: { data: NewsData; at: number } | null;
} = { weather: null, sunrise: null, prices: null, news: null };

// ─── Weather ────────────────────────────────────────────────────────────────

async function fetchWeather(): Promise<WeatherData | null> {
  if (cache.weather && Date.now() - cache.weather.at < 10 * 60 * 1000)
    return cache.weather.data;
  try {
    const { lat, lon } = config.location;
    const res = await fetchWithTimeout(
      `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`,
      { headers: { "User-Agent": `infoskjerm/1.0 ${config.metContact}` } }
    );
    if (!res.ok) throw new Error();
    const raw: WeatherResponse = await res.json();
    const ts = raw.properties.timeseries;
    const cur = ts[0];
    const det = cur.data.instant.details;
    const symbolCode =
      cur.data.next_1_hours?.summary.symbol_code ??
      cur.data.next_6_hours?.summary.symbol_code ??
      "cloudy";
    const now = new Date();
    const precipitation = ts
      .filter((t) => {
        const h = (new Date(t.time).getTime() - now.getTime()) / 3600000;
        return h >= 0 && h <= 10;
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
    const data: WeatherData = {
      temperature: Math.round(det.air_temperature),
      symbolCode,
      windSpeed: Math.round(det.wind_speed),
      humidity: Math.round(det.relative_humidity),
      precipitation,
      locationName: config.location.name,
    };
    cache.weather = { data, at: Date.now() };
    return data;
  } catch {
    return cache.weather?.data ?? null;
  }
}

// ─── Sunrise ────────────────────────────────────────────────────────────────

async function fetchSunrise(): Promise<SunriseData | null> {
  if (cache.sunrise && Date.now() - cache.sunrise.at < 24 * 60 * 60 * 1000)
    return cache.sunrise.data;
  try {
    const { lat, lon } = config.location;
    const today = new Date().toISOString().split("T")[0];
    const res = await fetchWithTimeout(
      `https://api.met.no/weatherapi/sunrise/3.0/sun?lat=${lat}&lon=${lon}&date=${today}&offset=+01:00`,
      { headers: { "User-Agent": `infoskjerm/1.0 ${config.metContact}` } }
    );
    if (!res.ok) throw new Error();
    const raw: SunriseResponse = await res.json();
    const fmt = (iso: string) =>
      new Date(iso).toLocaleTimeString("no-NO", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Oslo",
      });
    const data: SunriseData = {
      sunrise: fmt(raw.properties.sunrise.time),
      sunset: fmt(raw.properties.sunset.time),
    };
    cache.sunrise = { data, at: Date.now() };
    return data;
  } catch {
    return cache.sunrise?.data ?? null;
  }
}

// ─── Prices ─────────────────────────────────────────────────────────────────

async function fetchOneDayPrices(
  year: string,
  month: string,
  day: string
): Promise<PricesResponse | null> {
  const area = config.electricity.priceArea;
  try {
    const res = await fetchWithTimeout(
      `https://www.hvakosterstrommen.no/api/v1/prices/${year}/${month}-${day}_${area}.json`
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchPrices(): Promise<PricesData | null> {
  if (cache.prices && Date.now() - cache.prices.at < 60 * 60 * 1000)
    return cache.prices.data;
  try {
    const now = new Date();
    const [year, month, day] = now.toISOString().split("T")[0].split("-");
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [ty, tm, td] = tomorrow.toISOString().split("T")[0].split("-");

    const today = await fetchOneDayPrices(year, month, day);
    if (!today) throw new Error();

    let tomorrowPrices: PricesResponse | null = null;
    if (now.getHours() >= 13) {
      tomorrowPrices = await fetchOneDayPrices(ty, tm, td);
    }

    const data: PricesData = { today, tomorrow: tomorrowPrices };
    cache.prices = { data, at: Date.now() };
    return data;
  } catch {
    return cache.prices?.data ?? null;
  }
}

// ─── Bus ────────────────────────────────────────────────────────────────────

const BUS_QUERY = `
query StopDepartures($id: String!, $count: Int!) {
  stopPlace(id: $id) {
    name
    estimatedCalls(numberOfDepartures: $count, timeRange: 7200, omitNonBoarding: true) {
      expectedDepartureTime
      destinationDisplay { frontText }
      serviceJourney {
        journeyPattern {
          line { publicCode transportMode }
        }
      }
    }
  }
}
`;

async function fetchOneStop(
  stopId: string,
  count: number
): Promise<StopDepartures | null> {
  try {
    const res = await fetchWithTimeout(
      "https://api.entur.io/journey-planner/v3/graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ET-Client-Name": "infoskjerm-privat",
        },
        body: JSON.stringify({
          query: BUS_QUERY,
          variables: { id: stopId, count },
        }),
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const raw: StopPlaceResponse = await res.json();
    const stop = raw.data.stopPlace;
    if (!stop) return null;
    const now = new Date();
    return {
      stopId,
      stopName: stop.name,
      departures: stop.estimatedCalls.map((call) => {
        const exp = new Date(call.expectedDepartureTime);
        return {
          line: call.serviceJourney.journeyPattern.line.publicCode,
          destination: call.destinationDisplay.frontText,
          expectedTime: exp.toLocaleTimeString("no-NO", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Oslo",
          }),
          minutesUntil: Math.round((exp.getTime() - now.getTime()) / 60000),
        };
      }),
    };
  } catch {
    return null;
  }
}

async function fetchBus(): Promise<BusData | null> {
  const results = await Promise.all(
    config.bus.stops.map((s) => fetchOneStop(s.stopId, s.maxDepartures))
  );
  const data = results.filter((r): r is StopDepartures => r !== null);
  return data.length > 0 ? data : null;
}

// ─── News ───────────────────────────────────────────────────────────────────

function parseRSS(xml: string): NewsData {
  const items: NewsData["items"] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const titleMatch =
      block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ??
      block.match(/<title>(.*?)<\/title>/);
    const linkMatch = block.match(/<link>(.*?)<\/link>/);
    const pubDateMatch = block.match(/<pubDate>(.*?)<\/pubDate>/);
    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].trim(),
        link: linkMatch[1].trim(),
        pubDate: pubDateMatch ? pubDateMatch[1].trim() : "",
      });
    }
    if (items.length >= 6) break;
  }
  return { items };
}

async function fetchNews(): Promise<NewsData | null> {
  if (cache.news && Date.now() - cache.news.at < 5 * 60 * 1000)
    return cache.news.data;
  try {
    const res = await fetchWithTimeout("https://www.nrk.no/toppsaker.rss", {
      headers: { "User-Agent": "infoskjerm/1.0" },
    });
    if (!res.ok) throw new Error();
    const xml = await res.text();
    const data = parseRSS(xml);
    cache.news = { data, at: Date.now() };
    return data;
  } catch {
    return cache.news?.data ?? null;
  }
}

// ─── Combined endpoint ───────────────────────────────────────────────────────

export async function GET() {
  // Fetch all in parallel — each has its own timeout and fallback
  const [weather, sunrise, prices, bus, news] = await Promise.all([
    fetchWeather(),
    fetchSunrise(),
    fetchPrices(),
    fetchBus(),
    fetchNews(),
  ]);

  return NextResponse.json({ weather, sunrise, prices, bus, news } satisfies DashboardData);
}
