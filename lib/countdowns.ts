import type { CountdownEntry } from "./types/countdown";

const STORAGE_KEY = "infoskjerm-countdowns";
const CHANGE_EVENT = "infoskjerm-countdowns-change";

function isEntry(value: unknown): value is CountdownEntry {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<CountdownEntry>;
  return (
    typeof v.id === "string" &&
    typeof v.date === "string" &&
    typeof v.description === "string"
  );
}

export function getEntries(): CountdownEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
  } catch {
    return [];
  }
}

function save(entries: CountdownEntry[]): CountdownEntry[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* ignore quota / private-mode errors */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return entries;
}

export function addEntry(date: string, description: string): CountdownEntry[] {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return save([...getEntries(), { id, date, description }]);
}

export function removeEntry(id: string): CountdownEntry[] {
  return save(getEntries().filter((e) => e.id !== id));
}

export function subscribe(listener: () => void): () => void {
  const handler = () => listener();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
