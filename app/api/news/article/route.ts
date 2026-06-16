import { NextResponse, type NextRequest } from "next/server";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type { FullArticle } from "@/lib/types/news";

const cache = new Map<string, { data: FullArticle; fetchedAt: number }>();
const CACHE_TTL = 30 * 60 * 1000;
const MAX_CACHE = 50;
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
};
const ERROR_HEADERS = { "Cache-Control": "no-store" };

const NOISE = new Set([
  "Lytt til saken",
  "Har du tips?",
  "Send oss informasjon, bilder eller video.",
]);

interface ParseArticleResponse {
  data?: {
    title?: string;
    lead?: string;
    body?: string;
    author?: string;
    published?: string;
    main_image?: string;
    summary?: string[];
    url?: string;
  };
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json(
      { error: "Mangler eller ugyldig url" },
      { status: 400, headers: ERROR_HEADERS }
    );
  }

  const cached = cache.get(url);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cached.data, { headers: CACHE_HEADERS });
  }

  const apiKey = process.env.PARSE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "PARSE_API_KEY mangler" },
      { status: 503, headers: ERROR_HEADERS }
    );
  }

  try {
    const res = await fetchWithTimeout(
      `https://api.parse.bot/scraper/8edd2188-6e92-4cd5-af59-d9a4a69e9394/get_article?url=${encodeURIComponent(url)}`,
      { headers: { "X-API-Key": apiKey } },
      15000
    );
    if (!res.ok) throw new Error(`parse.bot ${res.status}`);
    const raw = (await res.json()) as ParseArticleResponse;
    const a = raw.data ?? {};

    const body = String(a.body ?? "")
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p && !NOISE.has(p))
      .join("\n\n");

    const summary =
      Array.isArray(a.summary) && a.summary.length > 0 ? a.summary : undefined;

    const data: FullArticle = {
      title: a.title ?? "",
      lead: a.lead || undefined,
      body,
      author: a.author || undefined,
      published: a.published || undefined,
      mainImage: a.main_image || undefined,
      summary,
      url,
    };

    if (cache.size >= MAX_CACHE) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(url, { data, fetchedAt: Date.now() });
    return NextResponse.json(data, { headers: CACHE_HEADERS });
  } catch {
    if (cached) return NextResponse.json(cached.data, { headers: CACHE_HEADERS });
    return NextResponse.json(
      { error: "Kunne ikke hente artikkel" },
      { status: 503, headers: ERROR_HEADERS }
    );
  }
}
