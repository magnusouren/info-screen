"use client";

import { useEffect, useState } from "react";
import type { Scene, ScenesData } from "@/lib/types/scenes";

const FAILED_FLASH_MS = 2000;

/** Henter SmartThings-scener og eksponerer en funksjon for å aktivere dem. */
export function useScenes() {
  const [data, setData] = useState<ScenesData | null>(null);
  const [error, setError] = useState(false);
  const [connectUrl, setConnectUrl] = useState<string | null>(null);
  const [firingIds, setFiringIds] = useState<Set<string>>(new Set());
  const [failedId, setFailedId] = useState<string | null>(null);

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

  const trigger = async (scene: Scene) => {
    setFiringIds((prev) => new Set(prev).add(scene.id));
    try {
      const res = await fetch("/api/scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: scene.id }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setFailedId(scene.id);
    } finally {
      setFiringIds((prev) => {
        const next = new Set(prev);
        next.delete(scene.id);
        return next;
      });
    }
  };

  return { data, error, connectUrl, firingIds, failedId, trigger };
}
