import { config } from "@/lib/config";
import type { Scene } from "@/lib/types/scenes";

const MAX_SUGGESTIONS = 2;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function inWindow(now: number, from: number, to: number): boolean {
  // Vinduer som går over midnatt (f.eks. 22:00–02:00)
  return from <= to ? now >= from && now < to : now >= from || now < to;
}

/** Foreslår opptil to scener basert på ukedag og klokkeslett. */
export function suggestScenes(scenes: Scene[], date: Date): Scene[] {
  const day = date.getDay() === 0 ? 7 : date.getDay();
  const now = date.getHours() * 60 + date.getMinutes();
  const byName = new Map(scenes.map((s) => [s.name.toLowerCase(), s]));

  for (const rule of config.smartThings.suggestions) {
    if (!rule.days.includes(day)) continue;
    if (!inWindow(now, toMinutes(rule.from), toMinutes(rule.to))) continue;

    const matches = rule.scenes
      .map((name) => byName.get(name.toLowerCase()))
      .filter((s): s is Scene => !!s)
      .slice(0, MAX_SUGGESTIONS);
    if (matches.length > 0) return matches;
  }
  return [];
}
