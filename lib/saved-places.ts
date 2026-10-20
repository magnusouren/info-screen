export interface SavedPlace {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export const STORAGE_KEY = "infoskjerm-saved-places";

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

function readFromStorage(): SavedPlace[] | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (p): p is SavedPlace =>
        !!p &&
        typeof p.id === "string" &&
        typeof p.name === "string" &&
        Number.isFinite(p.lat) &&
        Number.isFinite(p.lon)
    );
  } catch {
    return null;
  }
}

let snapshot: SavedPlace[] = [];
let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  const stored = readFromStorage();
  if (stored) snapshot = stored;
  initialized = true;
}

export function getPlaces(): SavedPlace[] {
  ensureInitialized();
  return snapshot;
}

const EMPTY: SavedPlace[] = [];

export function getServerPlaces(): SavedPlace[] {
  return EMPTY;
}

function persist(next: SavedPlace[]) {
  snapshot = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private-mode errors */
  }
  notify();
}

export function addPlace(place: SavedPlace) {
  ensureInitialized();
  if (snapshot.some((p) => p.id === place.id)) return;
  persist([...snapshot, place]);
}

export function removePlace(id: string) {
  ensureInitialized();
  persist(snapshot.filter((p) => p.id !== id));
}
