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
