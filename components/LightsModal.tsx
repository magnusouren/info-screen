"use client";

import { useEffect, useState } from "react";
import {
  XIcon as X,
  LightbulbIcon as Lightbulb,
  PowerIcon as Power,
} from "@phosphor-icons/react";
import { averageOf, brightnessFill, kelvinFill } from "@/lib/colorUtils";
import type { Light } from "@/lib/types/lights";
import { useLights } from "@/lib/useLights";
import Slider from "./Slider";

const MIN_KELVIN = 2200;
const MAX_KELVIN = 6500;
const DEFAULT_KELVIN = 4000;

type LightPatch = { switch?: "on" | "off"; level?: number; colorTemperature?: number };

function RoomSliders({
  name,
  lights,
  onChange,
}: {
  name: string;
  lights: Light[];
  onChange: (id: string, patch: LightPatch) => void;
}) {
  const dimmable = lights.filter((l) => l.level !== null);
  const tunable = lights.filter((l) => l.colorTemperature !== null);

  const liveLevelAvg = averageOf(
    dimmable.filter((l) => l.switch === "on").map((l) => l.level!),
  );
  const [syncedLevelAvg, setSyncedLevelAvg] = useState(liveLevelAvg);
  const [level, setLevel] = useState(liveLevelAvg ?? 50);
  if (liveLevelAvg !== null && liveLevelAvg !== syncedLevelAvg) {
    setSyncedLevelAvg(liveLevelAvg);
    setLevel(liveLevelAvg);
  }

  const liveTempAvg = averageOf(
    tunable.filter((l) => l.switch === "on").map((l) => l.colorTemperature!),
  );
  const [syncedTempAvg, setSyncedTempAvg] = useState(liveTempAvg);
  const [temp, setTemp] = useState(liveTempAvg ?? DEFAULT_KELVIN);
  if (liveTempAvg !== null && liveTempAvg !== syncedTempAvg) {
    setSyncedTempAvg(liveTempAvg);
    setTemp(liveTempAvg);
  }

  if (dimmable.length === 0 && tunable.length === 0) return null;

  const anyOn = lights.some((l) => l.switch === "on");
  const toggleAll = () => {
    for (const l of lights) onChange(l.id, { switch: anyOn ? "off" : "on" });
  };

  return (
    <div className="pb-3 mb-2 border-b border-border/60">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleAll}
          aria-pressed={anyOn}
          aria-label={`Slå ${anyOn ? "av" : "på"} alle lys i ${name}`}
          className={`flex items-center justify-center w-8 h-8 rounded-full border shrink-0 transition-colors ${
            anyOn
              ? "bg-accent/20 border-accent text-accent"
              : "bg-surface border-border text-text-4"
          }`}
        >
          <Lightbulb size={15} weight={anyOn ? "fill" : "light"} />
        </button>

        <div className="w-28 shrink-0 text-text-2 text-sm font-light truncate">
          {name}
        </div>

        {dimmable.length > 0 && (
          <Slider
            value={level}
            min={1}
            max={100}
            onChange={setLevel}
            onCommit={(next) => {
              for (const l of dimmable) onChange(l.id, { switch: "on", level: next });
            }}
            ariaLabel={`Dimme alle lys i ${name}`}
            indicatorColor={brightnessFill(level)}
            className="flex-1"
          />
        )}
      </div>

      {tunable.length > 0 && (
        <div className="flex items-center gap-3 mt-2">
          <div className="w-8 shrink-0" />
          <div className="w-28 shrink-0" />
          <Slider
            value={temp}
            min={MIN_KELVIN}
            max={MAX_KELVIN}
            step={100}
            onChange={setTemp}
            onCommit={(next) => {
              for (const l of tunable) onChange(l.id, { switch: "on", colorTemperature: next });
            }}
            ariaLabel={`Fargetemperatur for alle lys i ${name}`}
            indicatorColor={kelvinFill(temp, MIN_KELVIN, MAX_KELVIN)}
            className="flex-1"
          />
        </div>
      )}
    </div>
  );
}

function LightRow({
  light,
  onChange,
}: {
  light: Light;
  onChange: (id: string, patch: LightPatch) => void;
}) {
  const [syncedLevel, setSyncedLevel] = useState(light.level);
  const [level, setLevel] = useState(light.level ?? 100);
  if (light.level !== syncedLevel) {
    setSyncedLevel(light.level);
    setLevel(light.level ?? 100);
  }

  const [syncedTemp, setSyncedTemp] = useState(light.colorTemperature);
  const [temp, setTemp] = useState(light.colorTemperature ?? DEFAULT_KELVIN);
  if (light.colorTemperature !== syncedTemp) {
    setSyncedTemp(light.colorTemperature);
    setTemp(light.colorTemperature ?? DEFAULT_KELVIN);
  }

  const on = light.switch === "on";
  const toggle = () => onChange(light.id, { switch: on ? "off" : "on" });

  return (
    <div className="py-2.5">
      <div className="flex items-center gap-3">
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
          <Slider
            value={level}
            min={1}
            max={100}
            disabled={!on}
            onChange={setLevel}
            onCommit={(next) => onChange(light.id, { switch: "on", level: next })}
            ariaLabel={`Lysstyrke for ${light.label}`}
            indicatorColor={brightnessFill(level)}
            className="flex-1"
          />
        )}
      </div>

      {light.colorTemperature !== null && (
        <div className="flex items-center gap-3 mt-2">
          <div className="w-8 shrink-0" />
          <div className="w-28 shrink-0" />
          <Slider
            value={temp}
            min={MIN_KELVIN}
            max={MAX_KELVIN}
            step={100}
            disabled={!on}
            onChange={setTemp}
            onCommit={(next) => onChange(light.id, { switch: "on", colorTemperature: next })}
            ariaLabel={`Fargetemperatur for ${light.label}`}
            indicatorColor={kelvinFill(temp, MIN_KELVIN, MAX_KELVIN)}
            className="flex-1"
          />
        </div>
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
  onChange: (id: string, patch: LightPatch) => void;
}) {
  return (
    <div>
      <div className="text-xs text-text-3 uppercase tracking-widest mb-1">
        {name}
      </div>
      {lights.length > 1 && (
        <RoomSliders name={name} lights={lights} onChange={onChange} />
      )}
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
