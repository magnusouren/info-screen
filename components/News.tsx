"use client";

import { useEffect, useState } from "react";
import { Newspaper } from "@phosphor-icons/react";
import type { NewsData } from "@/lib/types/news";

export default function News() {
  const [data, setData] = useState<NewsData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/news");
        if (!res.ok) throw new Error();
        setData(await res.json());
        setError(false);
      } catch {
        setError(true);
      }
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-widest mb-2">
        <Newspaper size={13} weight="light" />
        NRK Nyheter
      </div>
      {!data ? (
        <div className="text-zinc-700 text-sm animate-pulse">
          {error ? "Nyheter utilgjengelig" : "Laster nyheter…"}
        </div>
      ) : (
        <div className="space-y-2">
          {data.items.map((item, i) => (
            <div key={i} className="text-zinc-400 text-sm font-light leading-snug border-l border-zinc-800 pl-3">
              {item.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
