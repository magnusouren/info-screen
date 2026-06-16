export interface SunriseResponse {
  when: { interval: [string, string] };
  properties: {
    body: string;
    sunrise: { time: string; azimuth: number };
    sunset: { time: string; azimuth: number };
    solarnoon: { time: string; disc_centre_elevation: number; visible: boolean };
    solarmidnight: { time: string; disc_centre_elevation: number; visible: boolean };
  };
}

export interface SunriseData {
  sunrise: string;
  sunset: string;
}
