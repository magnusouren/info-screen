import type { WeatherData } from "./weather";
import type { SunriseData } from "./sunrise";
import type { PricesData } from "./prices";
import type { BusData } from "./bus";

export interface DashboardData {
  weather: WeatherData | null;
  sunrise: SunriseData | null;
  prices: PricesData | null;
  bus: BusData | null;
}
