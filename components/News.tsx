"use client";

import { useRef, useState } from "react";
import type { NewsItem } from "@/lib/types/news";
import NewsFeed from "./NewsFeed";
import ArticleModal from "./ArticleModal";

const PAGES: { key: string; category: string | null; title: string }[] = [
  { key: "latest", category: null, title: "Siste" },
  { key: "sport", category: "sport", title: "Sport" },
];

export default function News() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [openItem, setOpenItem] = useState<NewsItem | null>(null);

  const goTo = (i: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <>
      <div className="h-full flex flex-col min-h-0">
        <div className="flex justify-end gap-1.5 mb-1 shrink-0">
          {PAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Vis side ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === page ? "w-4 bg-text-3" : "w-1.5 bg-text-5"
              }`}
            />
          ))}
        </div>
        <div
          ref={containerRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            const w = el.clientWidth || 1;
            const i = Math.round(el.scrollLeft / w);
            if (i !== page) setPage(i);
          }}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide flex-1 min-h-0"
        >
          {PAGES.map((p) => (
            <div
              key={p.key}
              className="snap-start shrink-0 w-full overflow-y-auto pr-px"
            >
              <NewsFeed
                category={p.category}
                title={p.title}
                onOpen={setOpenItem}
              />
            </div>
          ))}
        </div>
      </div>
      {openItem && (
        <ArticleModal item={openItem} onClose={() => setOpenItem(null)} />
      )}
    </>
  );
}
