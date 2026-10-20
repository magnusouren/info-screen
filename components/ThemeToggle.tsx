"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  SunIcon as Sun,
  MoonIcon as Moon,
  MoonStarsIcon as MoonStars,
  BookOpenIcon as BookOpen,
} from "@phosphor-icons/react";
import {
  THEME_LABELS,
  cycleTheme,
  getServerTheme,
  getTheme,
  subscribeTheme,
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

const TOAST_MS = 1500;

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);
  const [toast, setToast] = useState<Theme | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast]);

  const handleClick = () => {
    setToast(cycleTheme());
  };

  const Icon = ICONS[theme];

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Bytt fargetema (nåværende: ${THEME_LABELS[theme]})`}
        className="fixed top-[calc(env(safe-area-inset-top)+1rem)] right-[calc(env(safe-area-inset-right)+1rem)] z-40 flex items-center justify-center w-9 h-9 rounded-full bg-surface/70 border border-border text-text-4 opacity-50 hover:opacity-100 focus-visible:opacity-100 transition-opacity"
      >
        <Icon size={16} weight="light" />
      </button>
      {toast && (
        <div
          className="fixed top-[calc(env(safe-area-inset-top)+4rem)] right-[calc(env(safe-area-inset-right)+1rem)] z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-surface/90 backdrop-blur border border-border text-text-2 shadow-lg pointer-events-none"
          role="status"
        >
          <Icon size={16} weight="light" />
          <span className="text-xs font-light tracking-wide">
            {THEME_LABELS[toast]}
          </span>
        </div>
      )}
    </>
  );
}
