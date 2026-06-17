"use client";

import { useEffect, useState } from "react";
import { MoneyIcon as Money } from "@phosphor-icons/react";
import type { CurrencyData } from "@/lib/types/currency";

function format(n: number): string {
  return n.toLocaleString("no-NO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function Currency() {
  const [data, setData] = useState<CurrencyData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/currency");
        if (!res.ok) throw new Error();
        const json = (await res.json()) as CurrencyData;
        if (!cancelled) {
          setData(json);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };
    load();
    const id = setInterval(load, 60 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest mb-2">
        <Money size={13} weight="light" />
        Valuta
      </div>
      {!data ? (
        <div className="text-text-5 text-sm animate-pulse">
          {error ? "Valuta utilgjengelig" : "Laster valuta…"}
        </div>
      ) : (
        <ul className="space-y-1">
          {data.rates.map((r) => (
            <li
              key={r.code}
              className="flex items-baseline gap-2 text-sm font-light"
            >
              <span className="text-text-3 w-10">{r.code}</span>
              <span className="text-text-2 tabular-nums ml-auto">
                {format(r.nokPerUnit)}
              </span>
              <span className="text-text-4 text-xs">kr</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
