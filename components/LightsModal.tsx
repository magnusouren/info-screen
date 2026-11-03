"use client";

import { useState } from "react";
import {
  XIcon as X,
  LightbulbIcon as Lightbulb,
  PowerIcon as Power,
} from "@phosphor-icons/react";
import { averageOf, brightnessFill } from "@/lib/colorUtils";
import { groupLights } from "@/lib/lightGroups";
import type { Light } from "@/lib/types/lights";
import { useLights } from "@/lib/useLights";
import GroupTile from "./GroupTile";
import LightTile from "./LightTile";
import Modal from "./Modal";
import Skeleton from "./Skeleton";
import Slider from "./Slider";

type LightPatch = { switch?: "on" | "off"; level?: number; colorTemperature?: number };

function RoomHeader({
  name,
  lights,
  onChange,
}: {
  name: string;
  lights: Light[];
  onChange: (id: string, patch: LightPatch) => void;
}) {
  const dimmable = lights.filter((l) => l.level !== null);

  const liveLevelAvg = averageOf(
    dimmable.filter((l) => l.switch === "on").map((l) => l.level!),
  );
  const [syncedLevelAvg, setSyncedLevelAvg] = useState(liveLevelAvg);
  const [level, setLevel] = useState(liveLevelAvg ?? 50);
  if (liveLevelAvg !== null && liveLevelAvg !== syncedLevelAvg) {
    setSyncedLevelAvg(liveLevelAvg);
    setLevel(liveLevelAvg);
  }

  const anyOn = lights.some((l) => l.switch === "on");
  const toggleAll = () => {
    for (const l of lights) onChange(l.id, { switch: anyOn ? "off" : "on" });
  };

  return (
    <div className="flex items-center gap-3 mb-3">
      <button
        type="button"
        onClick={toggleAll}
        aria-pressed={anyOn}
        aria-label={`Slå ${anyOn ? "av" : "på"} alle lys i ${name}`}
        className={`flex items-center justify-center w-7 h-7 rounded-full border shrink-0 transition-colors ${
          anyOn
            ? "bg-accent/20 border-accent text-accent"
            : "bg-surface border-border text-text-4"
        }`}
      >
        <Lightbulb size={13} weight={anyOn ? "fill" : "light"} />
      </button>

      <div className="text-xs text-text-3 uppercase tracking-widest shrink-0">{name}</div>

      {dimmable.length > 1 && (
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
          className="flex-1 max-w-40 ml-auto"
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
  onChange: (id: string, patch: LightPatch) => void;
}) {
  const items = groupLights(lights);

  return (
    <div>
      {lights.length > 1 ? (
        <RoomHeader name={name} lights={lights} onChange={onChange} />
      ) : (
        <div className="text-xs text-text-3 uppercase tracking-widest mb-3">{name}</div>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-5">
        {items.map((item) =>
          item.kind === "single" ? (
            <LightTile key={item.light.id} light={item.light} onChange={onChange} />
          ) : (
            <GroupTile key={item.id} name={item.name} lights={item.lights} onChange={onChange} />
          ),
        )}
      </div>
    </div>
  );
}

export default function LightsModal({ onClose }: { onClose: () => void }) {
  const { data, error, connectUrl, setLight } = useLights();

  const allOff = () => {
    if (!data) return;
    for (const room of data) {
      for (const light of room.lights) {
        if (light.switch === "on") setLight(light.id, { switch: "off" });
      }
    }
  };

  return (
    <Modal onClose={onClose} panelClassName="max-w-2xl h-[80vh]">
      {(close) => (
        <>
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
                onClick={close}
                className="text-text-3 hover:text-text-2 active:scale-90 transition-[color,transform] p-1"
                aria-label="Lukk"
              >
                <X size={20} weight="light" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 px-5 py-4">
            {!data ? (
              !error ? (
                <div className="space-y-7">
                  {[0, 1].map((g) => (
                    <div key={g}>
                      <Skeleton className="h-2.5 w-16 mb-3" />
                      <div className="flex gap-4">
                        {[0, 1, 2].map((i) => (
                          <Skeleton key={i} className="w-20 h-44 rounded-2xl" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : connectUrl ? (
                <div className="text-text-5 text-sm py-4">
                  <a href={connectUrl} className="text-accent underline underline-offset-2">
                    Koble til SmartThings
                  </a>
                </div>
              ) : (
                <div className="text-text-5 text-sm py-4">Lys utilgjengelig</div>
              )
            ) : data.length === 0 ? (
              <div className="text-text-4 text-sm font-light py-4">Fant ingen lys</div>
            ) : (
              <div className="space-y-7">
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
        </>
      )}
    </Modal>
  );
}
