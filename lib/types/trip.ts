export interface TripLeg {
  mode: string;
  line: string | null;
  lineColor: string | null;
  lineName: string | null;
  fromName: string;
  toName: string;
  durationSeconds: number;
  distanceMeters: number;
  expectedStartTime: string;
  expectedEndTime: string;
  realtime: boolean;
  serviceJourneyId: string | null;
  operatorName: string | null;
  situations: string[];
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
  points: string | null;
}

export interface TripPattern {
  expectedStartTime: string;
  expectedEndTime: string;
  durationSeconds: number;
  walkDistanceMeters: number;
  legs: TripLeg[];
}

export interface PlaceSearchResult {
  id: string;
  name: string;
  label: string;
  lat: number;
  lon: number;
}
