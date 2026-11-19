"use client";

import { useSyncExternalStore } from "react";
import { SparkleIcon as Sparkle } from "@phosphor-icons/react";
import { suggestScenes } from "@/lib/sceneSuggestions";
import { SCENE_ICONS } from "./Scenes";
import { useScenes } from "./useScenes";

// Tikker én gang i minuttet slik at forslagene følger klokka.
function subscribeMinute(onChange: () => void) {
  const id = setInterval(onChange, 15 * 1000);
  return () => clearInterval(id);
}
const getMinute = () => Math.floor(Date.now() / 60_000);
const getServerMinute = () => null;

/** Foreslåtte scener basert på ukedag og klokkeslett. Vises kun på mobil (skjult fra sm og opp). */
export default function SmartScenes() {
  const minute = useSyncExternalStore(
    subscribeMinute,
    getMinute,
    getServerMinute,
  );
  const { data, firingIds, failedId, trigger } = useScenes();

  if (minute === null || !data) return null;
  const suggestions = suggestScenes(data.scenes, new Date(minute * 60_000));
  if (suggestions.length === 0) return null;

  // Fragment slik at innhold og skillelinje blir egne flex-elementer i
  // kolonnen, og skillelinjen forsvinner når det ikke er noen forslag.
  return (
    <>
      <div className="sm:hidden">
        <div className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest mb-2">
          <Sparkle size={13} weight="light" />
          Forslag
        </div>
        <div className="grid grid-cols-2 gap-2">
          {suggestions.map((s) => {
            const Icon = SCENE_ICONS[s.icon];
            const firing = firingIds.has(s.id);
            const failed = failedId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => trigger(s)}
                disabled={firing}
                aria-busy={firing}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-colors bg-surface/40 text-text-2 hover:bg-surface/70 ${
                  failed ? "border-live text-live" : "border-border"
                } ${firing ? "opacity-60" : ""}`}
              >
                <Icon size={24} weight="light" />
                <span className="text-base font-light tracking-wide text-left leading-tight">
                  {s.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="sm:hidden border-t border-border" />
    </>
  );
}
