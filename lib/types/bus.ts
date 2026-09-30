export interface LinePresentation {
  colour: string | null;
  textColour: string | null;
}

export interface EstimatedCall {
  expectedDepartureTime: string;
  destinationDisplay: { frontText: string };
  serviceJourney: {
    journeyPattern: {
      line: {
        publicCode: string;
        transportMode: string;
        presentation: LinePresentation | null;
      };
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
  color: string | null;
}

export interface StopDepartures {
  stopId: string;
  stopName: string;
  departures: Departure[];
}

export type BusData = StopDepartures[];
