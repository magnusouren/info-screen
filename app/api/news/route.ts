import { NextResponse, type NextRequest } from "next/server";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type { NewsData, NewsItem } from "@/lib/types/news";

const cache = new Map<string, { data: NewsData; fetchedAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;
const MAX_ITEMS = 10;
const ALLOWED_CATEGORIES = new Set(["sport", "nyheter", "rampelys"]);
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=120",
};
const ERROR_HEADERS = { "Cache-Control": "no-store" };

interface ParseArticle {
  title?: string;
  url?: string;
}

async function fetchVG(category: string | null): Promise<NewsData | null> {
  const apiKey = process.env.PARSE_API_KEY;
  if (!apiKey) return null;
  const url = category
    ? `https://api.parse.bot/scraper/8edd2188-6e92-4cd5-af59-d9a4a69e9394/get_category_articles?category=${encodeURIComponent(category)}`
    : `https://api.parse.bot/scraper/8edd2188-6e92-4cd5-af59-d9a4a69e9394/get_latest_news?limit=${MAX_ITEMS}`;
  try {
    const res = await fetchWithTimeout(
      url,
      { headers: { "X-API-Key": apiKey } },
      20000
    );
    if (!res.ok) return null;
    const raw = (await res.json()) as { data?: { articles?: ParseArticle[] } };
    const articles = raw.data?.articles ?? [];
    const items: NewsItem[] = articles
      .filter((a): a is Required<Pick<ParseArticle, "title" | "url">> & ParseArticle =>
        !!a.title && !!a.url
      )
      .slice(0, MAX_ITEMS)
      .map((a) => ({
        title: a.title,
        url: a.url,
        canFetchFull: true,
      }));
    return items.length ? { source: "vg", items } : null;
  } catch {
    return null;
  }
}

async function fetchNRK(): Promise<NewsData | null> {
  try {
    const res = await fetchWithTimeout("https://www.nrk.no/toppsaker.rss", {
      headers: { "User-Agent": "infoskjerm/1.0" },
    });
    if (!res.ok) return null;
    const xml = await res.text();
    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRegex.exec(xml)) !== null) {
      const block = m[1];
      const titleMatch =
        block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ??
        block.match(/<title>(.*?)<\/title>/);
      const linkMatch = block.match(/<link>(.*?)<\/link>/);
      if (titleMatch && linkMatch) {
        items.push({
          title: titleMatch[1].trim(),
          url: linkMatch[1].trim(),
          canFetchFull: false,
        });
      }
      if (items.length >= MAX_ITEMS) break;
    }
    return items.length ? { source: "nrk", items } : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const categoryRaw = request.nextUrl.searchParams.get("category");
  const category =
    categoryRaw && ALLOWED_CATEGORIES.has(categoryRaw) ? categoryRaw : null;
  const cacheKey = category ?? "latest";

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cached.data, { headers: CACHE_HEADERS });
  }

  // NRK fallback only applies to "latest" — categories are VG-only.
  const data = category
    ? await fetchVG(category)
    : (await fetchVG(null)) ?? (await fetchNRK());

  if (!data) {
    if (cached) return NextResponse.json(cached.data, { headers: CACHE_HEADERS });
    return NextResponse.json(
      { error: "Kunne ikke hente nyheter" },
      { status: 503, headers: ERROR_HEADERS }
    );
  }

  cache.set(cacheKey, { data, fetchedAt: Date.now() });
  return NextResponse.json(data, { headers: CACHE_HEADERS });
}
