import { NextResponse } from "next/server";
import type { InsideData } from "@/lib/types/inside";

// Mock-data inntil en faktisk sensor er på plass.
// Bytt ut innholdet i GET med et kall mot sensoren (Home Assistant,
// Shelly, Aqara osv.) — UI-en leser fortsatt /api/inside og kan stå urørt.
function mockReading(): InsideData {
  const now = new Date();
  const hourFrac = now.getHours() + now.getMinutes() / 60;
  const phase = (hourFrac / 24) * 2 * Math.PI;

  const temperature = 21 + Math.sin(phase) * 1.2;
  const humidity = 44 + Math.cos(phase) * 6;

  return {
    temperature: Math.round(temperature * 10) / 10,
    humidity: Math.round(humidity),
    updatedAt: now.toISOString(),
  };
}

export async function GET() {
  return NextResponse.json(mockReading(), {
    headers: { "Cache-Control": "no-store" },
  });
}
