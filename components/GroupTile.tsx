"use client";

import { useState } from "react";
import { CaretDownIcon as CaretDown, CaretUpIcon as CaretUp } from "@phosphor-icons/react";
import { averageOf } from "@/lib/colorUtils";
import type { Light } from "@/lib/types/lights";
import LightTile, { LightTileShell } from "./LightTile";

const DEFAULT_KELVIN = 4000;

type LightPatch = { switch?: "on" | "off"; level?: number; colorTemperature?: number };

/** A multi-zone fixture (e.g. "Trippel topp/midt/nede") shown as one combined
 *  fader by default — dragging it sets every member to the same value — with
 *  an expand toggle that swaps it for the individual lights' own tiles. */
export default function GroupTile({
  name,
  lights,
  onChange,
}: {
  name: string;
  lights: Light[];
  onChange: (id: string, patch: LightPatch) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const dimmable = lights.filter((l) => l.level !== null);
  const tunable = lights.filter((l) => l.colorTemperature !== null);

  const liveLevelAvg = averageOf(dimmable.filter((l) => l.switch === "on").map((l) => l.level!));
  const [syncedLevelAvg, setSyncedLevelAvg] = useState(liveLevelAvg);
  const [level, setLevel] = useState(liveLevelAvg ?? 100);
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

  const anyOn = lights.some((l) => l.switch === "on");

  const expandButton = (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      aria-expanded={expanded}
      aria-label={expanded ? `Vis ${name} som én gruppe` : `Vis og styr ${name} enkeltvis`}
      className="flex items-center justify-center w-5 h-5 rounded-full border border-border-strong bg-surface text-text-3 hover:text-text-2 shadow-sm"
    >
      {expanded ? <CaretUp size={11} weight="bold" /> : <CaretDown size={11} weight="bold" />}
    </button>
  );

  if (!expanded) {
    return (
      <div className="relative isolate">
        <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-2xl border border-border/40 bg-surface/30 -z-10" />
        <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-2xl border border-border/60 bg-surface/50 -z-10" />
        <LightTileShell
          label={name}
          on={anyOn}
          onToggle={() => {
            for (const l of lights) onChange(l.id, { switch: anyOn ? "off" : "on" });
          }}
          dimmable={dimmable.length > 0}
          level={level}
          onLevelChange={setLevel}
          onLevelCommit={(next) => {
            for (const l of dimmable) onChange(l.id, { switch: "on", level: next });
          }}
          tunable={tunable.length > 0}
          temp={temp}
          onTempChange={setTemp}
          onTempCommit={(next) => {
            for (const l of tunable) onChange(l.id, { switch: "on", colorTemperature: next });
          }}
          sliderDisabled={false}
          corner={expandButton}
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-surface/30 p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] text-text-3 uppercase tracking-wide">{name}</span>
        {expandButton}
      </div>
      <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-3">
        {lights.map((l) => (
          <LightTile key={l.id} light={l} onChange={onChange} compact />
        ))}
      </div>
    </div>
  );
}
