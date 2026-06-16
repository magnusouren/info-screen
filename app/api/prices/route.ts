import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type { PricesResponse, PricesData } from "@/lib/types/prices";

let cache: { data: PricesData; fetchedAt: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function fetchPrices(year: string, month: string, day: string) {
  const area = config.electricity.priceArea;
  const url = `https://www.hvakosterstrommen.no/api/v1/prices/${year}/${month}-${day}_${area}.json`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return null;
  return res.json() as Promise<PricesResponse>;
}

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const [year, month, day] = todayStr.split("-");

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    const [ty, tm, td] = tomorrowStr.split("-");

    const today = await fetchPrices(year, month, day);
    if (!today) throw new Error("Fant ikke dagens priser");

    // Tomorrow's prices are published around 13:00
    let tomorrowPrices: PricesResponse | null = null;
    if (now.getHours() >= 13) {
      tomorrowPrices = await fetchPrices(ty, tm, td);
    }

    const data: PricesData = {
      today,
      tomorrow: tomorrowPrices,
    };

    cache = { data, fetchedAt: Date.now() };
    return NextResponse.json(data);
  } catch {
    if (cache) return NextResponse.json(cache.data);
    return NextResponse.json({ error: "Kunne ikke hente strømpris" }, { status: 503 });
  }
}
