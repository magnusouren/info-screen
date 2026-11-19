"use client";

import {
  PowerIcon as Power,
  LightbulbIcon as Lightbulb,
  MoonStarsIcon as MoonStars,
  FilmReelIcon as FilmReel,
  BroomIcon as Broom,
  ForkKnifeIcon as ForkKnife,
} from "@phosphor-icons/react";
import type { SceneIcon } from "@/lib/types/scenes";
import Skeleton from "./Skeleton";
import { useScenes } from "./useScenes";

export const SCENE_ICONS: Record<
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
  const { data, error, connectUrl, firingIds, failedId, trigger } =
    useScenes();

  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest mb-2">
        <Power size={13} weight="light" />
        Scener
      </div>

      {!data ? (
        !error ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1 rounded-xl px-2 sm:px-4 lg:px-6 py-2 border border-border bg-surface/40"
              >
                <Skeleton className="w-[26px] h-[26px] rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        ) : connectUrl ? (
          <div className="text-text-5 text-sm">
            <a
              href={connectUrl}
              className="text-accent underline underline-offset-2"
            >
              Koble til SmartThings
            </a>
          </div>
        ) : (
          <div className="text-text-5 text-sm">Scener utilgjengelig</div>
        )
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {data.scenes.map((s) => {
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
                className={`flex flex-col items-center gap-1 rounded-xl px-2 sm:px-4 lg:px-6 py-2 border transition-colors bg-surface/40 text-text-3 hover:text-text-2 hover:bg-surface/70 ${
                  failed ? "border-live text-live" : "border-border"
                } ${firing ? "opacity-60" : ""}`}
              >
                <Icon size={26} weight="light" />
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
