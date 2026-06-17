"use client";

import { useEffect, useState } from "react";
import {
  SunIcon as Sun,
  MoonIcon as Moon,
  MoonStarsIcon as MoonStars,
  BookOpenIcon as BookOpen,
} from "@phosphor-icons/react";
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

const LONG_PRESS_MS = 800;
const MOVE_TOLERANCE_PX = 12;
const TOAST_MS = 1500;

function currentTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  return isTheme(t) ? t : DEFAULT_THEME;
}

export default function ThemeToggle() {
  const [toast, setToast] = useState<Theme | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let toastTimer: ReturnType<typeof setTimeout> | null = null;
    let startX = 0;
    let startY = 0;

    const clearTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const cycle = () => {
      const cur = currentTheme();
      const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore quota / private-mode errors */
      }
      setToast(next);
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => setToast(null), TOAST_MS);
    };

    const onDown = (e: PointerEvent) => {
      const target = e.target;
      if (
        target instanceof Element &&
        target.closest("[data-no-long-press]")
      ) {
        return;
      }
      startX = e.clientX;
      startY = e.clientY;
      clearTimer();
      timer = setTimeout(cycle, LONG_PRESS_MS);
    };
    const onMove = (e: PointerEvent) => {
      if (!timer) return;
      if (
        Math.abs(e.clientX - startX) > MOVE_TOLERANCE_PX ||
        Math.abs(e.clientY - startY) > MOVE_TOLERANCE_PX
      ) {
        clearTimer();
      }
    };
    const onCancel = () => clearTimer();

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onCancel);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onCancel);
      window.removeEventListener("pointercancel", onCancel);
      clearTimer();
      if (toastTimer) clearTimeout(toastTimer);
    };
  }, []);

  if (!toast) return null;
  const Icon = ICONS[toast];
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-surface/90 backdrop-blur border border-border text-text-2 shadow-lg pointer-events-none"
      role="status"
    >
      <Icon size={16} weight="light" />
      <span className="text-xs font-light tracking-wide">
        {THEME_LABELS[toast]}
      </span>
    </div>
  );
}
