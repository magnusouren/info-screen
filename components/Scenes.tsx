"use client";

import {
  PowerIcon as Power,
  LightbulbIcon as Lightbulb,
  MoonStarsIcon as MoonStars,
  FilmReelIcon as FilmReel,
  BroomIcon as Broom,
  ForkKnifeIcon as ForkKnife,
  MoonIcon as Moon,
  SunIcon as Sun,
  SunDimIcon as SunDim,
  SunHorizonIcon as SunHorizon,
  HouseIcon as House,
  TelevisionIcon as Television,
  CircleNotchIcon as CircleNotch,
  CheckIcon as Check,
  XIcon as X,
} from "@phosphor-icons/react";
import type { SceneIcon } from "@/lib/types/scenes";
import Skeleton from "./Skeleton";
import { useScenes, type SceneStatus } from "./useScenes";

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
  moon: Moon,
  sun: Sun,
  sundim: SunDim,
  sunhorizon: SunHorizon,
  house: House,
  television: Television,
};

/** Sceneikonet, byttet ut med spinner / hake / kryss etter status. */
export function SceneStatusIcon({
  icon,
  status,
  size,
}: {
  icon: SceneIcon;
  status: SceneStatus;
  size: number;
}) {
  if (status === "firing")
    return <CircleNotch size={size} weight="light" className="animate-spin" />;
  if (status === "success") return <Check size={size} weight="light" />;
  if (status === "failed") return <X size={size} weight="light" />;
  const Icon = SCENE_ICONS[icon];
  return <Icon size={size} weight="light" />;
}

/** Felles statusfarger for scene-knapper. `idle` er klassene for normaltilstand. */
export function sceneStatusClass(status: SceneStatus, idle: string): string {
  switch (status) {
    case "success":
      return "border-accent text-accent";
    case "failed":
      return "border-live text-live";
    default:
      return `border-border ${idle}`;
  }
}

export default function Scenes() {
  const { data, error, connectUrl, statusOf, trigger } = useScenes();

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
            const status = statusOf(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => trigger(s)}
                disabled={status === "firing"}
                aria-busy={status === "firing"}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 sm:px-4 lg:px-6 py-2 border transition-colors bg-surface/40 hover:bg-surface/70 disabled:cursor-wait ${sceneStatusClass(status, "text-text-3 hover:text-text-2")}`}
              >
                <SceneStatusIcon icon={s.icon} status={status} size={26} />
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
