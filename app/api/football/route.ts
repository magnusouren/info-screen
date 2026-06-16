import { NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type { FootballResponse, FootballData } from "@/lib/types/football";

let cache: { data: FootballData; fetchedAt: number } | null = null;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes — parse.bot free tier is 5 req/min

function osloDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Oslo" });
}

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  const apiKey = process.env.PARSE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "PARSE_API_KEY mangler" },
      { status: 503 }
    );
  }

  try {
    const url = `https://api.parse.bot/scraper/8edd2188-6e92-4cd5-af59-d9a4a69e9394/get_sport_scores?sport=football&date=${osloDate()}`;
    const res = await fetchWithTimeout(url, {
      headers: { "X-API-Key": apiKey },
    });
    if (!res.ok) throw new Error(`parse.bot ${res.status}`);

    const raw: FootballResponse = await res.json();
    const data: FootballData = {
      matches: raw.data.events.map((e) => {
        const notStarted = e.status === "notStarted";
        const kickoff = e.start_date
          ? new Date(e.start_date).toLocaleTimeString("no-NO", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Oslo",
            })
          : null;
        return {
          id: e.id,
          home: e.teams[0]?.name ?? "?",
          away: e.teams[1]?.name ?? "?",
          homeScore: notStarted ? null : e.teams[0]?.score ?? null,
          awayScore: notStarted ? null : e.teams[1]?.score ?? null,
          status: e.status,
          statusDetail: e.status_detail,
          tournament: e.tournament,
          kickoff,
        };
      }),
    };

    cache = { data, fetchedAt: Date.now() };
    return NextResponse.json(data);
  } catch {
    if (cache) return NextResponse.json(cache.data);
    return NextResponse.json(
      { error: "Kunne ikke hente fotballkamper" },
      { status: 503 }
    );
  }
}
