"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { DashboardData } from "@/lib/types/dashboard";

interface DashboardContext {
  data: DashboardData | null;
  loading: boolean;
}

const Ctx = createContext<DashboardContext>({ data: null, loading: true });

export function useDashboard() {
  return useContext(Ctx);
}

// Polling intervals per module (ms)
const WEATHER_TTL = 10 * 60 * 1000;
const BUS_TTL = 30 * 1000;

export default function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 10000);
      const res = await fetch("/api/dashboard", { signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) return;
      const json: DashboardData = await res.json();
      setData(json);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // Re-fetch on the fastest interval (bus = 30s); server caches slower modules
    const id = setInterval(fetchAll, BUS_TTL);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Suppress unused warning — kept for future per-module refresh
  void WEATHER_TTL;

  return <Ctx.Provider value={{ data, loading }}>{children}</Ctx.Provider>;
}
