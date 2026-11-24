/** "HH:MM" → minutter etter midnatt. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Om `now` (minutter) er i [from, to). Vinduer kan gå over midnatt (f.eks. 22:00–02:00). */
export function inWindow(now: number, from: number, to: number): boolean {
  return from <= to ? now >= from && now < to : now >= from || now < to;
}
