import { NextResponse, type NextRequest } from "next/server";
import Parser from "rss-parser";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type { NewsData, NewsItem, NewsSource } from "@/lib/types/news";

type Category = "latest" | "sport";

interface FeedSpec {
  source: NewsSource;
  url: string;
  // VG has no sport-only RSS, so we filter the main feed by <category>.
  categoryFilter?: string;
}

const FEEDS: Record<Category, FeedSpec[]> = {
  latest: [
    { source: "nrk", url: "https://www.nrk.no/toppsaker.rss" },
    { source: "vg", url: "https://www.vg.no/rss/feed/" },
    { source: "tv2", url: "https://www.tv2.no/rss/nyheter" },
  ],
  sport: [
    { source: "nrk", url: "https://www.nrk.no/sport/toppsaker.rss" },
    { source: "vg", url: "https://www.vg.no/rss/feed/", categoryFilter: "Sport" },
    { source: "tv2", url: "https://www.tv2.no/rss/sport" },
  ],
};

const parser = new Parser();
const cache = new Map<Category, { data: NewsData; fetchedAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;
const MAX_ITEMS = 12;
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=120",
};
const ERROR_HEADERS = { "Cache-Control": "no-store" };

async function fetchFeed(spec: FeedSpec): Promise<NewsItem[]> {
  try {
    const res = await fetchWithTimeout(
      spec.url,
      { headers: { "User-Agent": "infoskjerm/1.0" } },
      8000
    );
    if (!res.ok) return [];
    const xml = await res.text();
    const feed = await parser.parseString(xml);
    const filter = spec.categoryFilter?.toLowerCase();
    return feed.items
      .filter((item) => {
        if (!item.title || !item.link) return false;
        if (!filter) return true;
        return (item.categories ?? []).some(
          (c) => typeof c === "string" && c.toLowerCase() === filter
        );
      })
      .map((item) => ({
        title: item.title!.trim(),
        url: item.link!.trim(),
        source: spec.source,
        publishedAt: item.isoDate,
      }));
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("category");
  const category: Category = raw === "sport" ? "sport" : "latest";

  const cached = cache.get(category);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cached.data, { headers: CACHE_HEADERS });
  }

  const results = await Promise.all(FEEDS[category].map(fetchFeed));
  const items = results
    .flat()
    .sort((a, b) => {
      const at = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      const bt = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      return bt - at;
    })
    .slice(0, MAX_ITEMS);

  if (items.length === 0) {
    if (cached) return NextResponse.json(cached.data, { headers: CACHE_HEADERS });
    return NextResponse.json(
      { error: "Kunne ikke hente nyheter" },
      { status: 503, headers: ERROR_HEADERS }
    );
  }

  const data: NewsData = { items };
  cache.set(category, { data, fetchedAt: Date.now() });
  return NextResponse.json(data, { headers: CACHE_HEADERS });
}
