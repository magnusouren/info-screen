"use client";

import { useEffect, useState } from "react";
import WorldClockModal from "./WorldClockModal";

export default function Clock() {
  const [time, setTime] = useState("--:--");
  const [date, setDate] = useState(" ");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("no-NO", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Oslo",
        })
      );
      const d = now.toLocaleDateString("no-NO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "Europe/Oslo",
      });
      setDate(d.charAt(0).toUpperCase() + d.slice(1));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-left cursor-pointer rounded-lg -mx-2 -my-1 px-2 py-1 hover:bg-surface/40 transition-colors"
        aria-label="Vis verdensklokke"
      >
        <div className="text-8xl font-thin tracking-tight text-text leading-none tabular-nums">
          {time}
        </div>
        <div className="mt-2 text-lg text-text-3 font-light tracking-wide">
          {date}
        </div>
      </button>
      {open && <WorldClockModal onClose={() => setOpen(false)} />}
    </>
  );
}
