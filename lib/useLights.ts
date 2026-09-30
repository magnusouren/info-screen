import { useEffect, useState } from "react";
import type { LightsData } from "@/lib/types/lights";

type Patch = { switch?: "on" | "off"; level?: number };

async function send(deviceId: string, patch: Patch) {
  const res = await fetch("/api/lights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId, ...patch }),
  });
  if (!res.ok) throw new Error();
}

export function useLights() {
  const [data, setData] = useState<LightsData | null>(null);
  const [error, setError] = useState(false);
  const [connectUrl, setConnectUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/lights");
        if (!res.ok) {
          const json = (await res.json().catch(() => null)) as
            | { connectUrl?: string }
            | null;
          if (!cancelled) setConnectUrl(json?.connectUrl ?? null);
          throw new Error();
        }
        const json = (await res.json()) as LightsData;
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
    const id = setInterval(load, 30 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const setLight = (deviceId: string, patch: Patch) => {
    setData((prev) =>
      prev
        ? prev.map((room) => ({
            ...room,
            lights: room.lights.map((l) =>
              l.id === deviceId
                ? { ...l, switch: patch.switch ?? l.switch, level: patch.level ?? l.level }
                : l
            ),
          }))
        : prev
    );
    send(deviceId, patch).catch(() => setError(true));
  };

  return { data, error, connectUrl, setLight };
}
