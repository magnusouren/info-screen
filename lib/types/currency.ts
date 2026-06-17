export type CurrencyCode = "EUR" | "USD" | "SEK" | "DKK";

export interface CurrencyRate {
  code: CurrencyCode;
  nokPerUnit: number;
}

export interface CurrencyData {
  rates: CurrencyRate[];
  date: string;
}
