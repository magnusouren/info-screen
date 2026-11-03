"use client";

import { useEffect, useState } from "react";
import { NewspaperIcon as Newspaper } from "@phosphor-icons/react";
import type { NewsData } from "@/lib/types/news";
import Skeleton from "./Skeleton";

export default function NewsFeed({
  category,
  title,
}: {
  category: "latest" | "sport";
  title: string;
}) {
  const [data, setData] = useState<NewsData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(
          `/api/news?category=${encodeURIComponent(category)}`
        );
        if (!res.ok) throw new Error();
        const json = (await res.json()) as NewsData;
        if (!cancelled) {
          setData(json);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [category]);

  return (
    <div className="flex flex-col sm:h-full sm:min-h-0 w-full">
      <div className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest mb-2 shrink-0">
        <Newspaper size={13} weight="light" />
        {title}
      </div>
      {!data ? (
        error ? (
          <div className="text-text-5 text-sm">Nyheter utilgjengelig</div>
        ) : (
          <ul className="divide-y divide-border/60">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="px-2 py-2 -mx-2 space-y-1.5">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-2/3" />
              </li>
            ))}
          </ul>
        )
      ) : (
        <ul className="divide-y divide-border/60 overflow-x-hidden sm:overflow-y-auto sm:flex-1 sm:min-h-0 pr-1">
          {data.items.map((item, i) => (
            <li key={i} className="px-2 py-2 -mx-2">
              <div className="text-text-2 text-sm font-light leading-snug">
                {item.title}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
