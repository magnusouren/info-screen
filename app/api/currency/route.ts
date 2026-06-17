import { NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type {
  CurrencyCode,
  CurrencyData,
  CurrencyRate,
} from "@/lib/types/currency";

const CODES: CurrencyCode[] = ["EUR", "USD", "SEK", "DKK"];
const URL =
  "https://data.norges-bank.no/api/data/EXR/B." +
  CODES.join("+") +
  ".NOK.SP?format=sdmx-json&lastNObservations=1&locale=no";

let cached: { data: CurrencyData; at: number } | null = null;
const CACHE_TTL = 6 * 60 * 60 * 1000;
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=43200",
};
const ERROR_HEADERS = { "Cache-Control": "no-store" };

interface SdmxValue {
  id: string;
}
interface SdmxDim {
  id: string;
  values: SdmxValue[];
}
interface SdmxSeries {
  attributes: number[];
  observations: Record<string, [string]>;
}
interface SdmxResponse {
  data: {
    dataSets: {
      series: Record<string, SdmxSeries>;
    }[];
    structure: {
      dimensions: { series: SdmxDim[] };
      attributes: { series: SdmxDim[] };
    };
  };
}

function parse(raw: SdmxResponse): CurrencyData | null {
  const ds = raw.data.dataSets[0];
  const dims = raw.data.structure.dimensions.series;
  const attrs = raw.data.structure.attributes.series;
  const baseDim = dims.find((d) => d.id === "BASE_CUR");
  const unitMultAttr = attrs.find((a) => a.id === "UNIT_MULT");
  if (!baseDim || !unitMultAttr) return null;

  const unitMultIndex = attrs.indexOf(unitMultAttr);
  const baseDimIndex = dims.indexOf(baseDim);

  const rates: CurrencyRate[] = [];
  let date = "";

  for (const [key, series] of Object.entries(ds.series)) {
    const parts = key.split(":").map(Number);
    const baseId = baseDim.values[parts[baseDimIndex]]?.id as CurrencyCode;
    if (!baseId || !CODES.includes(baseId)) continue;

    const obsKey = Object.keys(series.observations)[0];
    const rawValue = parseFloat(series.observations[obsKey][0]);
    const unitMultRaw = unitMultAttr.values[series.attributes[unitMultIndex]]?.id;
    const unitMult = unitMultRaw ? parseInt(unitMultRaw, 10) : 0;

    rates.push({ code: baseId, nokPerUnit: rawValue / Math.pow(10, unitMult) });
  }

  // Preserve the order configured in CODES.
  rates.sort((a, b) => CODES.indexOf(a.code) - CODES.indexOf(b.code));

  // Date comes from observation dimension; cheap path is the dataset
  // reportingBegin if present.
  const ds0 = raw.data.dataSets[0] as unknown as { reportingBegin?: string };
  if (ds0.reportingBegin) date = ds0.reportingBegin.slice(0, 10);

  return rates.length ? { rates, date } : null;
}

export async function GET() {
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return NextResponse.json(cached.data, { headers: CACHE_HEADERS });
  }

  try {
    const res = await fetchWithTimeout(URL, {}, 10000);
    if (!res.ok) throw new Error(`norges-bank ${res.status}`);
    const raw = (await res.json()) as SdmxResponse;
    const data = parse(raw);
    if (!data) throw new Error("parse failed");

    cached = { data, at: Date.now() };
    return NextResponse.json(data, { headers: CACHE_HEADERS });
  } catch {
    if (cached) return NextResponse.json(cached.data, { headers: CACHE_HEADERS });
    return NextResponse.json(
      { error: "Kunne ikke hente valutakurser" },
      { status: 503, headers: ERROR_HEADERS }
    );
  }
}
