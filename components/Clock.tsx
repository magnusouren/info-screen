"use client";

import { useEffect, useState } from "react";

export default function Clock() {
  const [time, setTime] = useState("--:--");
  const [date, setDate] = useState(" ");

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
    <div>
      <div className="text-8xl font-thin tracking-tight text-white leading-none tabular-nums">
        {time}
      </div>
      <div className="mt-2 text-lg text-zinc-400 font-light tracking-wide">
        {date}
      </div>
    </div>
  );
}
