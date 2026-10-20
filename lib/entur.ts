import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type {
  StopPlaceResponse,
  StopDepartures,
  NearbyStopDepartures,
} from "@/lib/types/bus";

const ET_CLIENT_NAME = "infoskjerm-privat";
const GRAPHQL_URL = "https://api.entur.io/journey-planner/v3/graphql";

const QUERY = `
query StopDepartures($id: String!, $count: Int!) {
  stopPlace(id: $id) {
    name
    estimatedCalls(numberOfDepartures: $count, timeRange: 7200) {
      expectedDepartureTime
      destinationDisplay { frontText }
      serviceJourney {
        journeyPattern {
          line {
            publicCode
            transportMode
            presentation { colour textColour }
          }
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
    const res = await fetchWithTimeout(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ET-Client-Name": ET_CLIENT_NAME,
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { id: stopId, count },
      }),
      cache: "no-store",
    });
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
          color: call.serviceJourney.journeyPattern.line.presentation?.colour ?? null,
        };
      }),
    };
  } catch {
    return null;
  }
}

const NEAREST_QUERY = `
query NearestStops($lat: Float!, $lon: Float!, $maxDistance: Float!, $maxResults: Int!) {
  nearest(
    latitude: $lat
    longitude: $lon
    maximumDistance: $maxDistance
    maximumResults: $maxResults
    filterByPlaceTypes: [stopPlace]
  ) {
    edges {
      node {
        distance
        place {
          ... on StopPlace {
            id
            name
          }
        }
      }
    }
  }
}
`;

interface NearestStopsResponse {
  data: {
    nearest: {
      edges: {
        node: {
          distance: number;
          place: { id: string; name: string } | null;
        };
      }[];
    } | null;
  };
}

export async function fetchNearbyStops(
  lat: number,
  lon: number,
  options: { radius: number; maxStops: number; departuresPerStop: number }
): Promise<NearbyStopDepartures[]> {
  const { radius, maxStops, departuresPerStop } = options;
  try {
    const res = await fetchWithTimeout(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ET-Client-Name": ET_CLIENT_NAME,
      },
      body: JSON.stringify({
        query: NEAREST_QUERY,
        variables: { lat, lon, maxDistance: radius, maxResults: maxStops },
      }),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const raw: NearestStopsResponse = await res.json();
    const edges = raw.data.nearest?.edges ?? [];

    const distanceById = new Map<string, number>();
    for (const edge of edges) {
      if (edge.node.place) distanceById.set(edge.node.place.id, edge.node.distance);
    }
    const stopIds = [...distanceById.keys()];
    if (stopIds.length === 0) return [];

    const results = await Promise.all(
      stopIds.map((id) => fetchStop(id, departuresPerStop))
    );

    const nearby: NearbyStopDepartures[] = [];
    results.forEach((stop, i) => {
      if (!stop) return;
      nearby.push({
        ...stop,
        distanceMeters: Math.round(distanceById.get(stopIds[i])!),
      });
    });
    nearby.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return nearby;
  } catch {
    return [];
  }
}
