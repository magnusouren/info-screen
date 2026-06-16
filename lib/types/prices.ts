export interface HourlyPrice {
  NOK_per_kWh: number;
  EUR_per_kWh: number;
  EXR: number;
  time_start: string;
  time_end: string;
}

export type PricesResponse = HourlyPrice[];

export interface PricesData {
  today: HourlyPrice[];
  tomorrow: HourlyPrice[] | null;
}
