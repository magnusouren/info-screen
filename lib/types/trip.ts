export interface TripLeg {
  mode: string;
  line: string | null;
  lineColor: string | null;
  fromName: string;
  toName: string;
  durationSeconds: number;
  distanceMeters: number;
  expectedStartTime: string;
  expectedEndTime: string;
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
