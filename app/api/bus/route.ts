import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { fetchStop } from "@/lib/entur";
import type { BusData, StopDepartures } from "@/lib/types/bus";

export async function GET() {
  try {
    const results = await Promise.all(
      config.bus.stops.map((s) => fetchStop(s.stopId, s.maxDepartures))
    );
    const data: BusData = results.filter((r): r is StopDepartures => r !== null);

    if (data.length === 0) {
      return NextResponse.json({ error: "Ingen stoppesteder funnet" }, { status: 503 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Kunne ikke hente bussavganger" }, { status: 503 });
  }
}
