export interface ServiceJourneyCall {
  stopName: string;
  expectedArrivalTime: string;
  aimedArrivalTime: string;
  realtime: boolean;
  forBoarding: boolean;
  forAlighting: boolean;
}

export interface ServiceJourneyDetails {
  line: string | null;
  lineName: string | null;
  lineColor: string | null;
  operatorName: string | null;
  notices: string[];
  calls: ServiceJourneyCall[];
}
