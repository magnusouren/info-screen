import { NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type { NewsData } from "@/lib/types/news";

let cache: { data: NewsData; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function parseRSS(xml: string): NewsData {
  const items: NewsData["items"] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const titleMatch = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ??
      block.match(/<title>(.*?)<\/title>/);
    const linkMatch = block.match(/<link>(.*?)<\/link>/);
    const pubDateMatch = block.match(/<pubDate>(.*?)<\/pubDate>/);

    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].trim(),
        link: linkMatch[1].trim(),
        pubDate: pubDateMatch ? pubDateMatch[1].trim() : "",
      });
    }

    if (items.length >= 6) break;
  }

  return { items };
}

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const res = await fetchWithTimeout("https://www.nrk.no/toppsaker.rss", {
      headers: { "User-Agent": "infoskjerm/1.0" },
    });

    if (!res.ok) throw new Error(`NRK RSS ${res.status}`);

    const xml = await res.text();
    const data = parseRSS(xml);

    cache = { data, fetchedAt: Date.now() };
    return NextResponse.json(data);
  } catch {
    if (cache) return NextResponse.json(cache.data);
    return NextResponse.json({ error: "Kunne ikke hente nyheter" }, { status: 503 });
  }
}
