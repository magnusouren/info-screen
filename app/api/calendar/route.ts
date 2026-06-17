import { NextResponse } from "next/server";
import ical, {
  type CalendarComponent,
  type EventInstance,
  type VEvent,
} from "node-ical";
import { config } from "@/lib/config";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type { CalendarData, CalendarEvent } from "@/lib/types/calendar";

let cached: { data: CalendarData; at: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
};
const ERROR_HEADERS = { "Cache-Control": "no-store" };

function isVEvent(c: CalendarComponent | undefined): c is VEvent {
  return !!c && c.type === "VEVENT";
}

async function fetchSource(
  name: string,
  url: string,
  color: string | undefined,
  from: Date,
  to: Date
): Promise<CalendarEvent[]> {
  try {
    const res = await fetchWithTimeout(url, {}, 10000);
    if (!res.ok) return [];
    const xml = await res.text();
    const parsed = await ical.async.parseICS(xml);

    const out: CalendarEvent[] = [];
    for (const component of Object.values(parsed)) {
      if (!isVEvent(component)) continue;
      // expandRecurringEvent handles both single and recurring events,
      // and applies RECURRENCE-ID overrides + EXDATE exclusions.
      const instances: EventInstance[] = ical.expandRecurringEvent(component, {
        from,
        to,
      });
      for (const inst of instances) {
        const title = String(inst.summary ?? "").trim();
        if (!title) continue;
        out.push({
          title,
          start: inst.start.toISOString(),
          end: inst.end.toISOString(),
          allDay: inst.isFullDay,
          calendar: name,
          color,
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}

export async function GET() {
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return NextResponse.json(cached.data, { headers: CACHE_HEADERS });
  }

  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + config.calendar.daysAhead);

  const sources = config.calendar.sources
    .map((s) => ({ ...s, url: process.env[s.envKey] }))
    .filter((s): s is typeof s & { url: string } => !!s.url);

  if (sources.length === 0) {
    return NextResponse.json(
      { error: "Ingen kalenderkilder konfigurert" },
      { status: 503, headers: ERROR_HEADERS }
    );
  }

  const results = await Promise.all(
    sources.map((s) => fetchSource(s.name, s.url, s.color, now, horizon))
  );

  const events = results
    .flat()
    .filter((e) => new Date(e.end).getTime() > now.getTime())
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
    .slice(0, config.calendar.maxEvents);

  const data: CalendarData = { events };
  cached = { data, at: Date.now() };
  return NextResponse.json(data, { headers: CACHE_HEADERS });
}
