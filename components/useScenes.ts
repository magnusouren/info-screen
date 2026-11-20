"use client";

import { useEffect, useState } from "react";
import type { Scene, ScenesData } from "@/lib/types/scenes";

const FAILED_FLASH_MS = 2000;
const SUCCESS_FLASH_MS = 1500;
/** Minste tid spinneren vises, så raske svar ikke bare blinker forbi. */
const MIN_FIRING_MS = 500;

export type SceneStatus = "idle" | "firing" | "success" | "failed";

/** Henter SmartThings-scener og eksponerer en funksjon for å aktivere dem. */
export function useScenes() {
  const [data, setData] = useState<ScenesData | null>(null);
  const [error, setError] = useState(false);
  const [connectUrl, setConnectUrl] = useState<string | null>(null);
  const [firingIds, setFiringIds] = useState<Set<string>>(new Set());
  const [failedId, setFailedId] = useState<string | null>(null);
  const [succeededId, setSucceededId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/scenes");
        if (!res.ok) {
          const json = (await res.json().catch(() => null)) as {
            connectUrl?: string;
          } | null;
          if (!cancelled) setConnectUrl(json?.connectUrl ?? null);
          throw new Error();
        }
        const json = (await res.json()) as ScenesData;
        if (!cancelled) {
          setData(json);
          setError(false);
          setConnectUrl(null);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };
    load();
    const id = setInterval(load, 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!failedId) return;
    const id = setTimeout(() => setFailedId(null), FAILED_FLASH_MS);
    return () => clearTimeout(id);
  }, [failedId]);

  useEffect(() => {
    if (!succeededId) return;
    const id = setTimeout(() => setSucceededId(null), SUCCESS_FLASH_MS);
    return () => clearTimeout(id);
  }, [succeededId]);

  const trigger = async (scene: Scene) => {
    setFiringIds((prev) => new Set(prev).add(scene.id));
    setFailedId((prev) => (prev === scene.id ? null : prev));
    setSucceededId((prev) => (prev === scene.id ? null : prev));
    const minDelay = new Promise((r) => setTimeout(r, MIN_FIRING_MS));
    try {
      const res = await fetch("/api/scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: scene.id }),
      });
      await minDelay;
      if (!res.ok) throw new Error();
      setSucceededId(scene.id);
    } catch {
      await minDelay;
      setFailedId(scene.id);
    } finally {
      setFiringIds((prev) => {
        const next = new Set(prev);
        next.delete(scene.id);
        return next;
      });
    }
  };

  const statusOf = (id: string): SceneStatus =>
    firingIds.has(id)
      ? "firing"
      : failedId === id
        ? "failed"
        : succeededId === id
          ? "success"
          : "idle";

  return { data, error, connectUrl, statusOf, trigger };
}
