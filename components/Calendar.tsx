"use client";

import { useEffect, useState } from "react";
import { CalendarBlankIcon as CalendarBlank } from "@phosphor-icons/react";
import type { CalendarData, CalendarEvent } from "@/lib/types/calendar";

const TZ = "Europe/Oslo";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayLabel(eventStart: Date, now: Date): string {
  const a = startOfDay(eventStart).getTime();
  const today = startOfDay(now).getTime();
  const diff = Math.round((a - today) / 86400000);
  if (diff <= 0) return "I dag";
  if (diff === 1) return "I morgen";
  return eventStart
    .toLocaleDateString("no-NO", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: TZ,
    })
    .replace(".", "");
}

function timeLabel(event: CalendarEvent): string {
  if (event.allDay) return "Hele dagen";
  const start = new Date(event.start).toLocaleTimeString("no-NO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
  const end = new Date(event.end).toLocaleTimeString("no-NO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
  return `${start}–${end}`;
}

function groupByDay(
  events: CalendarEvent[],
  now: Date
): { label: string; events: CalendarEvent[] }[] {
  const groups = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = dayLabel(new Date(e.start), now);
    const arr = groups.get(key) ?? [];
    arr.push(e);
    groups.set(key, arr);
  }
  return [...groups.entries()].map(([label, evs]) => ({ label, events: evs }));
}

export default function Calendar() {
  const [data, setData] = useState<CalendarData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/calendar");
        if (!res.ok) throw new Error();
        const json = (await res.json()) as CalendarData;
        if (!cancelled) {
          setData(json);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const groups = data ? groupByDay(data.events, new Date()) : [];

  return (
    <div className="flex flex-col min-h-0 max-h-48">
      <div className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest mb-3 shrink-0">
        <CalendarBlank size={13} weight="light" />
        Kalender
      </div>
      {!data ? (
        <div className="text-text-5 text-sm animate-pulse">
          {error ? "Kalender utilgjengelig" : "Laster kalender…"}
        </div>
      ) : data.events.length === 0 ? (
        <div className="text-text-4 text-sm font-light">Ingen hendelser</div>
      ) : (
        <ul className="space-y-2 overflow-y-auto overflow-x-hidden flex-1 min-h-0 pr-1">
          {groups.map((g) => (
            <li key={g.label}>
              <div className="text-text-3 text-[11px] uppercase tracking-wider mb-1">
                {g.label}
              </div>
              <ul className="space-y-1">
                {g.events.map((e, i) => (
                  <li key={i} className="flex items-baseline gap-2 min-w-0">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full shrink-0 translate-y-[-1px]"
                      style={{ backgroundColor: e.color ?? "var(--color-text-4)" }}
                      aria-hidden
                    />
                    <span className="text-text-3 text-xs font-light tabular-nums w-24 shrink-0">
                      {timeLabel(e)}
                    </span>
                    <span className="text-text-2 text-sm font-light truncate">
                      {e.title}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
