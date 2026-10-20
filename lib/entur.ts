import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type {
  StopPlaceResponse,
  StopDepartures,
  NearbyStopDepartures,
} from "@/lib/types/bus";
import type { TripPattern } from "@/lib/types/trip";
import type { ServiceJourneyDetails } from "@/lib/types/serviceJourney";

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
        id
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
          serviceJourneyId: call.serviceJourney.id,
        };
      }),
    };
  } catch {
    return null;
  }
}

const SERVICE_JOURNEY_QUERY = `
query ServiceJourney($id: String!) {
  serviceJourney(id: $id) {
    line {
      publicCode
      name
      presentation { colour }
    }
    operator { name }
    notices { text }
    estimatedCalls {
      quay { name }
      expectedArrivalTime
      aimedArrivalTime
      realtime
      forBoarding
      forAlighting
    }
  }
}
`;

interface ServiceJourneyResponse {
  data: {
    serviceJourney: {
      line: { publicCode: string; name: string; presentation: { colour: string | null } | null };
      operator: { name: string } | null;
      notices: { text: string }[];
      estimatedCalls: {
        quay: { name: string };
        expectedArrivalTime: string;
        aimedArrivalTime: string;
        realtime: boolean;
        forBoarding: boolean;
        forAlighting: boolean;
      }[];
    } | null;
  };
}

export async function fetchServiceJourney(id: string): Promise<ServiceJourneyDetails | null> {
  try {
    const res = await fetchWithTimeout(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ET-Client-Name": ET_CLIENT_NAME,
      },
      body: JSON.stringify({
        query: SERVICE_JOURNEY_QUERY,
        variables: { id },
      }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const raw: ServiceJourneyResponse = await res.json();
    const sj = raw.data.serviceJourney;
    if (!sj) return null;

    return {
      line: sj.line.publicCode,
      lineName: sj.line.name,
      lineColor: sj.line.presentation?.colour ?? null,
      operatorName: sj.operator?.name ?? null,
      notices: sj.notices.map((n) => n.text),
      calls: sj.estimatedCalls.map((c) => ({
        stopName: c.quay.name,
        expectedArrivalTime: c.expectedArrivalTime,
        aimedArrivalTime: c.aimedArrivalTime,
        realtime: c.realtime,
        forBoarding: c.forBoarding,
        forAlighting: c.forAlighting,
      })),
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

// Stoppesteder man aldri reiser fra, uavhengig av hvor nære de er
// (f.eks. feil side av veien / ikke faktisk brukbart i praksis).
const BLACKLISTED_STOP_IDS = new Set(["NSR:StopPlace:58254"]);

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
      if (edge.node.place && !BLACKLISTED_STOP_IDS.has(edge.node.place.id)) {
        distanceById.set(edge.node.place.id, edge.node.distance);
      }
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

const TRIP_QUERY = `
query Trip($from: Location!, $to: Location!, $numTripPatterns: Int!) {
  trip(from: $from, to: $to, numTripPatterns: $numTripPatterns) {
    tripPatterns {
      expectedStartTime
      expectedEndTime
      duration
      walkDistance
      legs {
        mode
        distance
        duration
        expectedStartTime
        expectedEndTime
        realtime
        line {
          publicCode
          name
          presentation { colour }
        }
        fromPlace { name latitude longitude }
        toPlace { name latitude longitude }
        serviceJourney {
          id
          operator { name }
        }
        situations { summary { value } }
        pointsOnLink { points }
      }
    }
  }
}
`;

interface TripResponse {
  data: {
    trip: {
      tripPatterns: {
        expectedStartTime: string;
        expectedEndTime: string;
        duration: number;
        walkDistance: number;
        legs: {
          mode: string;
          distance: number;
          duration: number;
          expectedStartTime: string;
          expectedEndTime: string;
          realtime: boolean;
          line: {
            publicCode: string;
            name: string;
            presentation: { colour: string | null } | null;
          } | null;
          fromPlace: { name: string; latitude: number; longitude: number };
          toPlace: { name: string; latitude: number; longitude: number };
          serviceJourney: { id: string; operator: { name: string } | null } | null;
          situations: { summary: { value: string }[] }[];
          pointsOnLink: { points: string } | null;
        }[];
      }[];
    } | null;
  };
}

export async function fetchTrip(
  from: { lat: number; lon: number; name: string },
  to: { lat: number; lon: number; name: string },
  numTripPatterns = 5
): Promise<TripPattern[]> {
  try {
    const res = await fetchWithTimeout(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ET-Client-Name": ET_CLIENT_NAME,
      },
      body: JSON.stringify({
        query: TRIP_QUERY,
        variables: {
          from: { coordinates: { latitude: from.lat, longitude: from.lon }, name: from.name },
          to: { coordinates: { latitude: to.lat, longitude: to.lon }, name: to.name },
          numTripPatterns,
        },
      }),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const raw: TripResponse = await res.json();
    const patterns = raw.data.trip?.tripPatterns ?? [];
    const mapped: TripPattern[] = patterns.map((p) => ({
      expectedStartTime: p.expectedStartTime,
      expectedEndTime: p.expectedEndTime,
      durationSeconds: p.duration,
      walkDistanceMeters: Math.round(p.walkDistance),
      legs: p.legs.map((l) => ({
        mode: l.mode,
        line: l.line?.publicCode ?? null,
        lineColor: l.line?.presentation?.colour ?? null,
        lineName: l.line?.name ?? null,
        fromName: l.fromPlace.name,
        toName: l.toPlace.name,
        durationSeconds: l.duration,
        distanceMeters: Math.round(l.distance),
        expectedStartTime: l.expectedStartTime,
        expectedEndTime: l.expectedEndTime,
        realtime: l.realtime,
        serviceJourneyId: l.serviceJourney?.id ?? null,
        operatorName: l.serviceJourney?.operator?.name ?? null,
        situations: l.situations.flatMap((s) => s.summary.map((m) => m.value)),
        fromLat: l.fromPlace.latitude,
        fromLon: l.fromPlace.longitude,
        toLat: l.toPlace.latitude,
        toLon: l.toPlace.longitude,
        points: l.pointsOnLink?.points ?? null,
      })),
    }));

    // Prefer transit over a pure walk — a direct walk can otherwise outrank
    // a transit option that actually arrives sooner. Only fall back to a
    // walk-only pattern when no transit option exists at all.
    const hasTransit = mapped.some((p) => p.legs.some((l) => l.mode !== "foot"));
    const filtered = hasTransit
      ? mapped.filter((p) => p.legs.some((l) => l.mode !== "foot"))
      : mapped;

    filtered.sort(
      (a, b) => new Date(a.expectedEndTime).getTime() - new Date(b.expectedEndTime).getTime()
    );

    // No transit option, and the only thing on offer is a trivial walk (e.g.
    // you're already basically there) — nothing meaningful to show.
    const TRIVIAL_WALK_SECONDS = 5 * 60;
    if (!hasTransit && filtered.length > 0 && filtered[0].durationSeconds < TRIVIAL_WALK_SECONDS) {
      return [];
    }

    return filtered;
  } catch {
    return [];
  }
}
