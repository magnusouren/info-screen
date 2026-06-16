export interface EstimatedCall {
  expectedDepartureTime: string;
  destinationDisplay: { frontText: string };
  serviceJourney: {
    journeyPattern: {
      line: { publicCode: string; transportMode: string };
    };
  };
}

export interface StopPlaceResponse {
  data: {
    stopPlace: {
      name: string;
      estimatedCalls: EstimatedCall[];
    } | null;
  };
}

export interface Departure {
  line: string;
  destination: string;
  expectedTime: string;
  minutesUntil: number;
}

export interface StopDepartures {
  stopId: string;
  stopName: string;
  departures: Departure[];
}

export type BusData = StopDepartures[];
