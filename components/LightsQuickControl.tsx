"use client";

import { useState } from "react";
import { LightbulbIcon as Lightbulb } from "@phosphor-icons/react";
import { useLights } from "@/lib/useLights";
import LightsModal from "./LightsModal";

export default function LightsQuickControl() {
  const { data, error, setLight } = useLights();
  const [open, setOpen] = useState(false);
  const [master, setMaster] = useState(50);
  const [initialized, setInitialized] = useState(false);

  if (!initialized && data) {
    const onDimmable = data
      .flatMap((r) => r.lights)
      .filter((l) => l.level !== null && l.switch === "on");
    if (onDimmable.length > 0) {
      const avg = Math.round(
        onDimmable.reduce((sum, l) => sum + (l.level ?? 0), 0) / onDimmable.length
      );
      setMaster(avg);
    }
    setInitialized(true);
  }

  const dimmableLights = data?.flatMap((r) => r.lights).filter((l) => l.level !== null) ?? [];

  const applyMaster = () => {
    for (const light of dimmableLights) {
      setLight(light.id, { switch: "on", level: master });
    }
  };

  if (!data && !error) return null;

  return (
    <>
      <div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest hover:text-text-2 transition-colors mb-2"
        >
          <Lightbulb size={13} weight="light" />
          Lys
        </button>

        {dimmableLights.length > 0 && (
          <input
            type="range"
            min={1}
            max={100}
            value={master}
            onChange={(e) => setMaster(Number(e.target.value))}
            onPointerUp={applyMaster}
            aria-label="Dimme alle lys"
            className="light-slider w-full"
          />
        )}
      </div>

      {open && <LightsModal onClose={() => setOpen(false)} />}
    </>
  );
}
