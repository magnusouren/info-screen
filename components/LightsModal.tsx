"use client";

import { useEffect, useState } from "react";
import {
  XIcon as X,
  LightbulbIcon as Lightbulb,
  PowerIcon as Power,
} from "@phosphor-icons/react";
import type { Light } from "@/lib/types/lights";
import { useLights } from "@/lib/useLights";

function LightRow({
  light,
  onChange,
}: {
  light: Light;
  onChange: (id: string, patch: { switch?: "on" | "off"; level?: number }) => void;
}) {
  const [syncedLevel, setSyncedLevel] = useState(light.level);
  const [level, setLevel] = useState(light.level ?? 100);
  if (light.level !== syncedLevel) {
    setSyncedLevel(light.level);
    setLevel(light.level ?? 100);
  }

  const on = light.switch === "on";
  const toggle = () => onChange(light.id, { switch: on ? "off" : "on" });

  return (
    <div className="flex items-center gap-3 py-2.5">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        aria-label={`Slå ${on ? "av" : "på"} ${light.label}`}
        className={`flex items-center justify-center w-8 h-8 rounded-full border shrink-0 transition-colors ${
          on
            ? "bg-accent/20 border-accent text-accent"
            : "bg-surface border-border text-text-4"
        }`}
      >
        <Lightbulb size={15} weight={on ? "fill" : "light"} />
      </button>

      <div className="w-28 shrink-0 text-text-2 text-sm font-light truncate">
        {light.label}
      </div>

      {light.level !== null && (
        <input
          type="range"
          min={1}
          max={100}
          value={level}
          disabled={!on}
          onChange={(e) => setLevel(Number(e.target.value))}
          onPointerUp={() => onChange(light.id, { switch: "on", level })}
          className="light-slider flex-1"
        />
      )}
    </div>
  );
}

function RoomSection({
  name,
  lights,
  onChange,
}: {
  name: string;
  lights: Light[];
  onChange: (id: string, patch: { switch?: "on" | "off"; level?: number }) => void;
}) {
  return (
    <div>
      <div className="text-xs text-text-3 uppercase tracking-widest mb-1">
        {name}
      </div>
      <div className="divide-y divide-border/60">
        {lights.map((l) => (
          <LightRow key={l.id} light={l} onChange={onChange} />
        ))}
      </div>
    </div>
  );
}

export default function LightsModal({ onClose }: { onClose: () => void }) {
  const { data, error, connectUrl, setLight } = useLights();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const allOff = () => {
    if (!data) return;
    for (const room of data) {
      for (const light of room.lights) {
        if (light.switch === "on") setLight(light.id, { switch: "off" });
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-8"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2 text-text-3 text-xs uppercase tracking-widest">
            <Lightbulb size={13} weight="light" />
            Lys
          </div>
          <div className="flex items-center gap-4">
            {data && data.some((r) => r.lights.some((l) => l.switch === "on")) && (
              <button
                type="button"
                onClick={allOff}
                className="flex items-center gap-1.5 text-text-3 text-xs font-light hover:text-text-2 transition-colors"
              >
                <Power size={13} weight="light" />
                Slå av alle
              </button>
            )}
            <button
              onClick={onClose}
              className="text-text-3 hover:text-text-2 transition-colors p-1"
              aria-label="Lukk"
            >
              <X size={20} weight="light" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-2">
          {!data ? (
            <div className="text-text-5 text-sm py-4">
              {!error ? (
                <span className="animate-pulse">Laster…</span>
              ) : connectUrl ? (
                <a href={connectUrl} className="text-accent underline underline-offset-2">
                  Koble til SmartThings
                </a>
              ) : (
                "Lys utilgjengelig"
              )}
            </div>
          ) : data.length === 0 ? (
            <div className="text-text-4 text-sm font-light py-4">Fant ingen lys</div>
          ) : (
            <div className="space-y-5">
              {data.map((room) => (
                <RoomSection
                  key={room.id}
                  name={room.name}
                  lights={room.lights}
                  onChange={setLight}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
