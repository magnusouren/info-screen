import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type { StopPlaceResponse, BusData, StopDepartures } from "@/lib/types/bus";

const QUERY = `
query StopDepartures($id: String!, $count: Int!) {
  stopPlace(id: $id) {
    name
    estimatedCalls(numberOfDepartures: $count, timeRange: 7200) {
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

async function fetchStop(
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
          query: QUERY,
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
