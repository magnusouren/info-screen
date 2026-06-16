"use client";

import { useEffect, useState } from "react";
import { X, Newspaper, ArrowSquareOut } from "@phosphor-icons/react";
import type { FullArticle, NewsItem } from "@/lib/types/news";

function formatPublished(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("no-NO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Oslo",
  });
}

export default function ArticleModal({
  item,
  onClose,
}: {
  item: NewsItem;
  onClose: () => void;
}) {
  const [article, setArticle] = useState<FullArticle | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/news/article?url=${encodeURIComponent(item.url)}`
        );
        if (!res.ok) throw new Error();
        const json = (await res.json()) as FullArticle;
        if (!cancelled) setArticle(json);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [item.url]);

  const published = article ? formatPublished(article.published) : null;
  const paragraphs = article
    ? article.body.split(/\n{2,}/).filter((p) => p.trim().length > 0)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-8"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <div className="flex items-center gap-1 text-text-3 text-xs font-light">
              <Newspaper size={11} weight="light" />
              <span>VG</span>
              {published && <span> · {published}</span>}
            </div>
            {article?.author && (
              <div className="text-text-2 text-sm font-light mt-0.5">
                {article.author}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text-3 hover:text-text-2 transition-colors -mr-1 -mt-1 p-1"
            aria-label="Lukk"
          >
            <X size={20} weight="light" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {!article ? (
            <div className="text-text-5 text-sm animate-pulse">
              {error ? "Kunne ikke laste artikkelen" : "Laster artikkel…"}
            </div>
          ) : (
            <article className="space-y-4">
              <h1 className="text-text text-2xl font-thin leading-tight">
                {article.title || item.title}
              </h1>

              {article.mainImage && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={article.mainImage}
                  alt=""
                  loading="lazy"
                  className="w-full rounded-lg border border-border"
                />
              )}

              {article.summary && article.summary.length > 0 && (
                <div className="bg-surface-2 border border-border rounded-lg p-4">
                  <div className="text-text-3 text-xs uppercase tracking-widest mb-2">
                    Kortversjonen
                  </div>
                  <ul className="space-y-1.5 list-disc pl-5">
                    {article.summary.map((s, i) => (
                      <li key={i} className="text-text-2 text-sm font-light leading-snug">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {article.lead && (
                <p className="text-text-2 text-base font-light leading-relaxed">
                  {article.lead}
                </p>
              )}

              <div className="space-y-3">
                {paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className="text-text-2 text-sm font-light leading-relaxed"
                  >
                    {p}
                  </p>
                ))}
              </div>

              <div className="pt-4 border-t border-border">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-text-3 hover:text-text-2 transition-colors text-xs"
                >
                  <span>Les hele saken på vg.no</span>
                  <ArrowSquareOut size={12} weight="light" />
                </a>
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
