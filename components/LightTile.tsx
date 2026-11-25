"use client";

import { useState, type ReactNode } from "react";
import { LightbulbIcon as Lightbulb } from "@phosphor-icons/react";
import { brightnessFill, kelvinFill } from "@/lib/colorUtils";
import type { Light } from "@/lib/types/lights";
import Slider from "./Slider";

const MIN_KELVIN = 2200;
const MAX_KELVIN = 6500;
const DEFAULT_KELVIN = 4000;

/** Fixed color-temperature presets shown as swatches under the brightness
 *  slider — one tap instead of fine-tuning a second slider. */
const KELVIN_PRESETS: { kelvin: number; name: string }[] = [
  { kelvin: 2200, name: "Stearinlys" },
  { kelvin: 2700, name: "Varm hvit" },
  { kelvin: 3200, name: "Myk hvit" },
  { kelvin: 4000, name: "Nøytral hvit" },
  { kelvin: 5000, name: "Dagslys" },
  { kelvin: 6500, name: "Kald hvit" },
];

/** The preset a measured temperature counts as — devices report arbitrary
 *  values (e.g. 2732K), so snap to the nearest swatch within a tolerance. */
function activePreset(temp: number): number | null {
  let best: number | null = null;
  let bestDist = Infinity;
  for (const p of KELVIN_PRESETS) {
    const d = Math.abs(p.kelvin - temp);
    if (d < bestDist) {
      best = p.kelvin;
      bestDist = d;
    }
  }
  return bestDist <= 200 ? best : null;
}

type LightPatch = { switch?: "on" | "off"; level?: number; colorTemperature?: number };

/** Shared light card: power button + label/status on top, a full-width
 *  brightness slider, and a row of color-temperature swatches — used by both
 *  a single light and a collapsed group so they read as the same control.
 *  The slider and swatches stay usable while the light is off: dragging or
 *  picking a swatch is also how you turn it on. */
export function LightTileShell({
  label,
  on,
  onToggle,
  dimmable,
  level,
  onLevelChange,
  onLevelCommit,
  tunable,
  temp,
  onTempCommit,
  compact = false,
  corner,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
  dimmable: boolean;
  level: number;
  onLevelChange: (v: number) => void;
  onLevelCommit: (v: number) => void;
  tunable: boolean;
  temp: number;
  onTempCommit: (v: number) => void;
  compact?: boolean;
  corner?: ReactNode;
}) {
  const active = on ? activePreset(temp) : null;
  // An off light shows an empty slider. While dragging it from off, show the
  // drag position; the commit turns the light on and the real level takes over.
  const [offPreview, setOffPreview] = useState<number | null>(null);
  const shownLevel = on ? level : (offPreview ?? 1);
  const status = !on ? "Av" : dimmable ? `${level} %` : "På";

  return (
    <div
      className={`flex flex-col rounded-2xl border border-border bg-surface/60 w-full ${
        compact ? "gap-2.5 p-3" : "gap-3 p-4"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={on}
          aria-label={`Slå ${on ? "av" : "på"} ${label}`}
          className={`flex items-center justify-center rounded-full border shrink-0 transition-colors ${
            compact ? "w-9 h-9" : "w-11 h-11"
          } ${on ? "bg-accent/20 border-accent text-accent" : "bg-surface-2 border-border text-text-4"}`}
        >
          <Lightbulb size={compact ? 16 : 20} weight={on ? "fill" : "light"} />
        </button>
        <div className="flex-1 min-w-0">
          <div className={`text-text-2 truncate ${compact ? "text-sm" : "text-base"}`}>{label}</div>
          <div className="text-xs text-text-4 tabular-nums">
            {status}
            {on && tunable && <span className="text-text-5"> · {temp}K</span>}
          </div>
        </div>
        {corner}
      </div>

      {dimmable && (
        <Slider
          value={shownLevel}
          min={1}
          max={100}
          onChange={(v) => {
            if (!on) setOffPreview(v);
            onLevelChange(v);
          }}
          onCommit={(v) => {
            setOffPreview(null);
            onLevelCommit(v);
          }}
          ariaLabel={`Lysstyrke for ${label}`}
          indicatorColor={brightnessFill(shownLevel)}
          className={`w-full ${compact ? "h-8!" : ""}`}
        />
      )}

      {tunable && (
        <div
          role="radiogroup"
          aria-label={`Fargetemperatur for ${label}`}
          className="flex items-center justify-between gap-1.5"
        >
          {KELVIN_PRESETS.map((p) => {
            const selected = active === p.kelvin;
            return (
              <button
                key={p.kelvin}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`${p.name} (${p.kelvin}K)`}
                title={`${p.name} · ${p.kelvin}K`}
                onClick={() => onTempCommit(p.kelvin)}
                className={`rounded-full shrink-0 transition-[transform,box-shadow] active:scale-90 ${
                  compact ? "w-7 h-7" : "w-9 h-9"
                } ${
                  selected
                    ? "ring-2 ring-offset-2 ring-offset-surface ring-text-2"
                    : "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]"
                } ${on ? "" : "opacity-60"}`}
                style={{ backgroundColor: kelvinFill(p.kelvin, MIN_KELVIN, MAX_KELVIN) }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LightTile({
  light,
  onChange,
  compact,
}: {
  light: Light;
  onChange: (id: string, patch: LightPatch) => void;
  compact?: boolean;
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

  return (
    <LightTileShell
      label={light.label}
      on={on}
      onToggle={() => onChange(light.id, { switch: on ? "off" : "on" })}
      dimmable={light.level !== null}
      level={level}
      onLevelChange={setLevel}
      onLevelCommit={(next) => onChange(light.id, { switch: "on", level: next })}
      tunable={light.colorTemperature !== null}
      temp={temp}
      onTempCommit={(next) => {
        setTemp(next);
        onChange(light.id, { switch: "on", colorTemperature: next });
      }}
      compact={compact}
    />
  );
}
