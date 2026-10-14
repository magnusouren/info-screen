export const THEMES = ["dark", "light", "night", "sepia"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_LABELS: Record<Theme, string> = {
  dark: "Mørk",
  light: "Lys",
  night: "Natt",
  sepia: "Sepia",
};

export const STORAGE_KEY = "infoskjerm-theme";
export const DEFAULT_THEME: Theme = "dark";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

const listeners = new Set<() => void>();

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  return isTheme(t) ? t : DEFAULT_THEME;
}

export function getServerTheme(): Theme {
  return DEFAULT_THEME;
}

export function cycleTheme(): Theme {
  const next = THEMES[(THEMES.indexOf(getTheme()) + 1) % THEMES.length];
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore quota / private-mode errors */
  }
  for (const listener of listeners) listener();
  return next;
}
