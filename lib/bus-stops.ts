import { config } from "@/lib/config";

export interface SavedStop {
  stopId: string;
  name?: string;
  maxDepartures: number;
}

export const STORAGE_KEY = "infoskjerm-bus-stops";
const DEFAULT_MAX_DEPARTURES = 5;

const DEFAULT_STOPS: SavedStop[] = config.bus.stops.map((s) => ({
  stopId: s.stopId,
  maxDepartures: s.maxDepartures,
}));

function defaultStops(): SavedStop[] {
  return DEFAULT_STOPS.map((s) => ({ ...s }));
}

const listeners = new Set<() => void>();
function notify() {
  for (const l of listeners) l();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readFromStorage(): SavedStop[] | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter(
        (s): s is SavedStop =>
          !!s && typeof s.stopId === "string" && s.stopId.length > 0
      )
      .map((s) => ({
        stopId: s.stopId,
        name: typeof s.name === "string" ? s.name : undefined,
        maxDepartures:
          Number.isFinite(s.maxDepartures) && s.maxDepartures > 0
            ? s.maxDepartures
            : DEFAULT_MAX_DEPARTURES,
      }));
  } catch {
    return null;
  }
}

let snapshot: SavedStop[] = defaultStops();
let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  const stored = readFromStorage();
  if (stored) snapshot = stored;
  initialized = true;
}

export function getStops(): SavedStop[] {
  ensureInitialized();
  return snapshot;
}

export function getServerStops(): SavedStop[] {
  return DEFAULT_STOPS;
}

function persist(next: SavedStop[]) {
  snapshot = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private-mode errors */
  }
  notify();
}

export function addStop(stop: SavedStop) {
  ensureInitialized();
  if (snapshot.some((s) => s.stopId === stop.stopId)) return;
  persist([...snapshot, stop]);
}

export function removeStop(stopId: string) {
  ensureInitialized();
  persist(snapshot.filter((s) => s.stopId !== stopId));
}

export function updateStop(stopId: string, patch: Partial<SavedStop>) {
  ensureInitialized();
  persist(
    snapshot.map((s) => (s.stopId === stopId ? { ...s, ...patch } : s))
  );
}

export function resetToDefaults() {
  persist(defaultStops());
}
