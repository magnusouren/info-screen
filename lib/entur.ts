import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type { StopPlaceResponse, StopDepartures } from "@/lib/types/bus";

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

export async function fetchStop(
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
