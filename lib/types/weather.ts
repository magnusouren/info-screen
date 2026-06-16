export interface WeatherTimeseries {
  time: string;
  data: {
    instant: {
      details: {
        air_temperature: number;
        wind_speed: number;
        relative_humidity: number;
      };
    };
    next_1_hours?: {
      summary: { symbol_code: string };
      details: { precipitation_amount: number };
    };
    next_6_hours?: {
      summary: { symbol_code: string };
      details: { precipitation_amount: number };
    };
  };
}

export interface WeatherResponse {
  properties: {
    timeseries: WeatherTimeseries[];
  };
}

export interface HourlyWeather {
  time: string;
  hour: string;
  symbolCode: string;
  temperature: number;
  windSpeed: number;
  precipitation: number;
}

export interface WeatherData {
  temperature: number;
  symbolCode: string;
  windSpeed: number;
  humidity: number;
  precipitation: { hour: string; amount: number }[];
  locationName: string;
  hourly: HourlyWeather[];
}
