"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon, MoonStars, BookOpen } from "@phosphor-icons/react";
import {
  THEMES,
  THEME_LABELS,
  STORAGE_KEY,
  DEFAULT_THEME,
  isTheme,
  type Theme,
} from "@/lib/theme";

const ICONS: Record<
  Theme,
  React.ComponentType<{ size?: number; weight?: "light" }>
> = {
  dark: Moon,
  light: Sun,
  night: MoonStars,
  sepia: BookOpen,
};

const listeners = new Set<() => void>();
function notify() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Theme {
  const t = document.documentElement.dataset.theme;
  return isTheme(t) ? t : DEFAULT_THEME;
}

function getServerSnapshot(): Theme {
  return DEFAULT_THEME;
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const cycle = () => {
    const idx = THEMES.indexOf(theme);
    const next = THEMES[(idx + 1) % THEMES.length];
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore quota / private-mode errors */
    }
    notify();
  };

  const Icon = ICONS[theme];

  return (
    <button
      type="button"
      onClick={cycle}
      suppressHydrationWarning
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-full bg-surface/80 backdrop-blur border border-border text-text-3 hover:text-text-2 hover:bg-surface transition-colors shadow-lg"
      aria-label={`Bytt tema (nå: ${THEME_LABELS[theme]})`}
    >
      <Icon size={16} weight="light" />
      <span className="text-xs font-light tracking-wide">
        {THEME_LABELS[theme]}
      </span>
    </button>
  );
}
