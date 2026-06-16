"use client";

import { useEffect, useState } from "react";
import { Newspaper } from "@phosphor-icons/react";
import type { NewsData, NewsItem, NewsSource } from "@/lib/types/news";

const SOURCE_LABEL: Record<NewsSource, string> = {
  vg: "VG",
  nrk: "NRK",
};

function Row({
  item,
  onOpen,
}: {
  item: NewsItem;
  onOpen?: (item: NewsItem) => void;
}) {
  const inner = (
    <div className="text-text-2 text-sm font-light leading-snug">
      {item.title}
    </div>
  );

  if (onOpen) {
    return (
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="block text-left w-full rounded-lg px-2 py-2 -mx-2 cursor-pointer hover:bg-surface/40 transition-colors"
      >
        {inner}
      </button>
    );
  }
  return <div className="px-2 py-2 -mx-2">{inner}</div>;
}

export default function NewsFeed({
  category,
  title,
  onOpen,
}: {
  category: string | null;
  title: string;
  onOpen: (item: NewsItem) => void;
}) {
  const [data, setData] = useState<NewsData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const qs = category ? `?category=${encodeURIComponent(category)}` : "";
        const res = await fetch(`/api/news${qs}`);
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
    <div className="w-full">
      <div className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest mb-2">
        <Newspaper size={13} weight="light" />
        {data ? `${SOURCE_LABEL[data.source]} · ${title}` : title}
      </div>
      {!data ? (
        <div className="text-text-5 text-sm animate-pulse">
          {error ? "Nyheter utilgjengelig" : "Laster nyheter…"}
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {data.items.map((item, i) => (
            <li key={i}>
              <Row
                item={item}
                onOpen={item.canFetchFull ? onOpen : undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
