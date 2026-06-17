"use client";

import { useEffect, useRef, useState } from "react";
import { HourglassIcon as Hourglass } from "@phosphor-icons/react";
import type { CountdownEntry } from "@/lib/types/countdown";
import { getEntries, subscribe } from "@/lib/countdowns";
import CountdownModal from "./CountdownModal";

const MAX_VISIBLE = 4;
const LONG_PRESS_MS = 600;
const MOVE_TOLERANCE_PX = 12;

function daysUntil(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function formatDays(n: number): string {
  if (n === 0) return "I dag";
  if (n === 1) return "I morgen";
  return `${n} dager`;
}

export default function Countdown() {
  const [entries, setEntries] = useState<CountdownEntry[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEntries(getEntries());
    return subscribe(() => setEntries(getEntries()));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let startX = 0;
    let startY = 0;
    const clear = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };
    const onDown = (e: PointerEvent) => {
      startX = e.clientX;
      startY = e.clientY;
      clear();
      timer = setTimeout(() => setOpen(true), LONG_PRESS_MS);
    };
    const onMove = (e: PointerEvent) => {
      if (!timer) return;
      if (
        Math.abs(e.clientX - startX) > MOVE_TOLERANCE_PX ||
        Math.abs(e.clientY - startY) > MOVE_TOLERANCE_PX
      ) {
        clear();
      }
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", clear);
    el.addEventListener("pointercancel", clear);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", clear);
      el.removeEventListener("pointercancel", clear);
      clear();
    };
  }, []);

  const upcoming = entries
    .map((e) => ({ ...e, days: daysUntil(e.date) }))
    .filter((e) => e.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, MAX_VISIBLE);

  return (
    <>
      <div
        ref={containerRef}
        data-no-long-press
        className="select-none touch-none"
      >
        <div className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest mb-2">
          <Hourglass size={13} weight="light" />
          Nedtelling
        </div>
        {upcoming.length === 0 ? (
          <div className="text-text-4 text-xs font-light leading-snug">
            Trykk og hold for å legge til datoer.
          </div>
        ) : (
          <ul className="space-y-1">
            {upcoming.map((e) => (
              <li
                key={e.id}
                className="flex items-baseline gap-3 text-sm font-light"
              >
                <span className="text-text tabular-nums w-20 shrink-0">
                  {formatDays(e.days)}
                </span>
                <span className="text-text-3 truncate">{e.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {open && <CountdownModal onClose={() => setOpen(false)} />}
    </>
  );
}
