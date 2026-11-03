"use client";

import { useState, type ReactNode } from "react";
import { LightbulbIcon as Lightbulb } from "@phosphor-icons/react";
import { brightnessFill, kelvinFill, kelvinGradient } from "@/lib/colorUtils";
import type { Light } from "@/lib/types/lights";
import VerticalSlider from "./VerticalSlider";

const MIN_KELVIN = 2200;
const MAX_KELVIN = 6500;
const DEFAULT_KELVIN = 4000;

type LightPatch = { switch?: "on" | "off"; level?: number; colorTemperature?: number };

/** Shared "channel strip" visual: power toggle, one or two vertical faders
 *  (brightness + color temperature), and a label — used by both a single
 *  light tile and a collapsed group tile so they read as the same control. */
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
  onTempChange,
  onTempCommit,
  compact = false,
  /** Overrides the default "disabled while off" rule for the faders — a
   *  group/room aggregate stays draggable even when everything in it is off,
   *  since dragging it is how you turn the group on. */
  sliderDisabled,
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
  onTempChange: (v: number) => void;
  onTempCommit: (v: number) => void;
  compact?: boolean;
  sliderDisabled?: boolean;
  corner?: ReactNode;
}) {
  const height = compact ? "h-24" : "h-32";
  const disabled = sliderDisabled ?? !on;

  return (
    <div className={`flex flex-col items-center gap-2 ${compact ? "w-16" : "w-20"} shrink-0`}>
      <div className="relative">
        {corner && <div className="absolute -top-1.5 -right-1.5 z-10">{corner}</div>}
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={on}
          aria-label={`Slå ${on ? "av" : "på"} ${label}`}
          className={`flex items-center justify-center rounded-full border shrink-0 transition-colors ${
            compact ? "w-7 h-7" : "w-8 h-8"
          } ${on ? "bg-accent/20 border-accent text-accent" : "bg-surface border-border text-text-4"}`}
        >
          <Lightbulb size={compact ? 13 : 15} weight={on ? "fill" : "light"} />
        </button>
      </div>

      <div className="text-[10px] text-text-4 tabular-nums h-3.5 leading-none">
        {dimmable ? (on ? `${level}%` : "–") : " "}
      </div>

      <div className={`flex items-end gap-2 ${height}`}>
        {dimmable && (
          <VerticalSlider
            value={level}
            min={1}
            max={100}
            disabled={disabled}
            onChange={onLevelChange}
            onCommit={onLevelCommit}
            ariaLabel={`Lysstyrke for ${label}`}
            fillColor={brightnessFill(level)}
            formatValue={(v) => `${v}%`}
            className={`${compact ? "w-8" : "w-10"} ${height}`}
          />
        )}
        {tunable && (
          <VerticalSlider
            value={temp}
            min={MIN_KELVIN}
            max={MAX_KELVIN}
            step={100}
            disabled={disabled}
            mode="position"
            trackBackground={kelvinGradient("to top")}
            thumbColor={kelvinFill(temp, MIN_KELVIN, MAX_KELVIN)}
            onChange={onTempChange}
            onCommit={onTempCommit}
            ariaLabel={`Fargetemperatur for ${label}`}
            formatValue={(v) => `${v}K`}
            className={`${compact ? "w-4" : "w-5"} ${height}`}
          />
        )}
      </div>

      <div
        className={`text-text-2 font-light text-center leading-tight line-clamp-2 ${
          compact ? "text-[10px]" : "text-[11px]"
        }`}
      >
        {label}
      </div>
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
      onTempChange={setTemp}
      onTempCommit={(next) => onChange(light.id, { switch: "on", colorTemperature: next })}
      compact={compact}
    />
  );
}
