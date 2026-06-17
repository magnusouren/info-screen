import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";
import { fetchStop } from "@/lib/entur";
import type { BusData, StopDepartures } from "@/lib/types/bus";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=20, stale-while-revalidate=30",
};
const ERROR_HEADERS = { "Cache-Control": "no-store" };
const MAX_STOPS = 8;

interface StopSpec {
  stopId: string;
  maxDepartures: number;
}

function parseStopsParam(raw: string | null, fallbackCount: number): StopSpec[] | null {
  if (!raw) return null;
  const specs: StopSpec[] = [];
  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    // stopId itself contains colons (e.g. NSR:StopPlace:58246), so split on the last one
    const sep = trimmed.lastIndexOf(":");
    const id = sep > 0 ? trimmed.slice(0, sep) : trimmed;
    const countStr = sep > 0 ? trimmed.slice(sep + 1) : "";
    if (!id) continue;
    const count = Number(countStr);
    specs.push({
      stopId: id,
      maxDepartures:
        Number.isFinite(count) && count > 0 ? Math.min(Math.floor(count), 20) : fallbackCount,
    });
    if (specs.length >= MAX_STOPS) break;
  }
  return specs.length ? specs : null;
}

export async function GET(request: NextRequest) {
  const stopsRaw = request.nextUrl.searchParams.get("stops");
  const countParam = Number(request.nextUrl.searchParams.get("count"));
  const fallbackCount =
    Number.isFinite(countParam) && countParam > 0 ? Math.min(Math.floor(countParam), 20) : 5;

  const stops = parseStopsParam(stopsRaw, fallbackCount) ?? config.bus.stops;

  try {
    const results = await Promise.all(
      stops.map((s) => fetchStop(s.stopId, s.maxDepartures))
    );
    const data: BusData = results.filter((r): r is StopDepartures => r !== null);

    if (data.length === 0) {
      return NextResponse.json(
        { error: "Ingen stoppesteder funnet" },
        { status: 503, headers: ERROR_HEADERS }
      );
    }

    return NextResponse.json(data, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke hente bussavganger" },
      { status: 503, headers: ERROR_HEADERS }
    );
  }
}
