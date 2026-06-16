"use client";

import { useEffect } from "react";

export default function WakeLock() {
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;

    let lock: WakeLockSentinel | null = null;

    const acquire = async () => {
      try {
        lock = await (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } }).wakeLock.request("screen");
      } catch {
        // Wake Lock not granted — silently ignore
      }
    };

    acquire();

    // Re-acquire when page becomes visible again
    const onVisible = () => {
      if (document.visibilityState === "visible") acquire();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release();
    };
  }, []);

  return null;
}
