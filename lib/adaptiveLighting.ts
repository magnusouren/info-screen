import { config } from "@/lib/config";

export interface AdaptivePoint {
  /** Klokkeslett "HH:MM" (Europe/Oslo). */
  time: string;
  /** Lysstyrke i prosent (1–100). */
  level: number;
  /** Fargetemperatur i Kelvin. */
  kelvin: number;
}

export interface AdaptiveTarget {
  level: number;
  kelvin: number;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Minutter siden midnatt i norsk tid, uavhengig av serverens tidssone. */
function osloMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/Oslo",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

/**
 * Regner ut ønsket styrke og fargetemperatur ved å interpolere lineært mellom
 * punktene i kurven. Kurven er syklisk, så siste punkt går over i det første
 * gjennom natten.
 */
export function adaptiveTarget(
  curve: readonly AdaptivePoint[],
  date: Date
): AdaptiveTarget | null {
  if (curve.length === 0) return null;
  const points = [...curve]
    .map((p) => ({ ...p, min: toMinutes(p.time) }))
    .sort((a, b) => a.min - b.min);
  if (points.length === 1) {
    return { level: points[0].level, kelvin: points[0].kelvin };
  }

  const now = osloMinutes(date);
  const day = 24 * 60;
  // Finn punktet før og etter nå (med wrap rundt midnatt).
  let nextIdx = points.findIndex((p) => p.min > now);
  if (nextIdx === -1) nextIdx = 0;
  const prev = points[(nextIdx - 1 + points.length) % points.length];
  const next = points[nextIdx];

  const span = (next.min - prev.min + day) % day || day;
  const elapsed = (now - prev.min + day) % day;
  const t = elapsed / span;

  return {
    level: Math.round(prev.level + (next.level - prev.level) * t),
    kelvin: Math.round(prev.kelvin + (next.kelvin - prev.kelvin) * t),
  };
}

/** Kurven for en scene, eller null hvis scenen ikke er adaptiv. */
export function curveForScene(sceneName: string): readonly AdaptivePoint[] | null {
  const scenes = config.smartThings.adaptiveScenes;
  const key = Object.keys(scenes).find(
    (name) => name.toLowerCase() === sceneName.toLowerCase()
  );
  return key ? scenes[key] : null;
}
