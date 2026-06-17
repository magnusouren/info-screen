"use client";

import { useEffect, useState } from "react";
import {
  PowerIcon as Power,
  LightbulbIcon as Lightbulb,
  MoonStarsIcon as MoonStars,
  FilmReelIcon as FilmReel,
  BroomIcon as Broom,
  ForkKnifeIcon as ForkKnife,
} from "@phosphor-icons/react";
import type { Scene, ScenesData, SceneIcon } from "@/lib/types/scenes";

const ICONS: Record<
  SceneIcon,
  React.ComponentType<{ size?: number; weight?: "light" | "thin" | "fill" }>
> = {
  power: Power,
  lightbulb: Lightbulb,
  moonstars: MoonStars,
  filmreel: FilmReel,
  broom: Broom,
  forkknife: ForkKnife,
};

export default function Scenes() {
  const [data, setData] = useState<ScenesData | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/scenes");
        if (!res.ok) throw new Error();
        const json = (await res.json()) as ScenesData;
        if (!cancelled) {
          setData(json);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };
    load();
    const id = setInterval(load, 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const activate = async (scene: Scene) => {
    if (!data) return;
    const nextId = data.activeId === scene.id ? null : scene.id;
    setPending(scene.id);
    setData({ ...data, activeId: nextId });
    try {
      const res = await fetch("/api/scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: nextId }),
      });
      if (!res.ok) throw new Error();
      const json = (await res.json()) as ScenesData;
      setData(json);
    } catch {
      setError(true);
    } finally {
      setPending(null);
    }
  };

  return (
    <div>
      {!data ? (
        <div className="text-text-5 text-sm animate-pulse">
          {error ? "Scener utilgjengelig" : "Laster…"}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {data.scenes.map((s) => {
            const Icon = ICONS[s.icon];
            const active = data.activeId === s.id;
            const busy = pending === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => activate(s)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-1 rounded-xl px-6 py-2 min-w-[110px] border transition-colors ${
                  active
                    ? "bg-surface border-border text-text"
                    : "bg-surface/40 border-border text-text-3 hover:text-text-2 hover:bg-surface/70"
                } ${busy ? "opacity-60" : ""}`}
              >
                <Icon size={26} weight={active ? "fill" : "light"} />
                <span className="text-sm font-light tracking-wide">
                  {s.name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
