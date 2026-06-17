import { NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { config } from "@/lib/config";
import type { FootballData, FootballMatch } from "@/lib/types/football";

let cache: { data: FootballData; fetchedAt: number } | null = null;
const CACHE_TTL = 3 * 60 * 1000;
const NEXT_DAY_CUTOFF_HOUR = 6;
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=180, stale-while-revalidate=120",
};
const ERROR_HEADERS = { "Cache-Control": "no-store" };

interface SportsDbEvent {
  idEvent: string;
  strTimestamp?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strLeague?: string;
  strStatus?: string;
}

function isAllowedLeague(league: string): boolean {
  const l = league.toLowerCase();
  if (l.includes("scottish")) return false;
  if (l.includes("club friend")) return false;
  return (
    l === "fifa world cup" ||
    l.includes("eliteserien") ||
    l === "english premier league" ||
    l.includes("champions league") ||
    l.includes("nations league") ||
    l.includes("norwegian cup") ||
    l.includes("world cup qualif") ||
    l.includes("european championship qualif") ||
    l.includes("euro qualif") ||
    (l.includes("friendl") && (l.includes("international") || l.includes("national")))
  );
}

function parseScore(s: string | null | undefined): number | null {
  if (s === null || s === undefined || s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function deriveStatus(
  startUTC: Date,
  hasScore: boolean,
  apiStatus: string | undefined
): { status: string; statusDetail: string } {
  const raw = apiStatus?.trim().toLowerCase() ?? "";
  if (raw === "ft" || raw === "match finished" || raw === "finished" || raw === "aet" || raw === "pen") {
    return { status: "finished", statusDetail: apiStatus ?? "Slutt" };
  }
  if (raw === "ns" || raw === "not started" || raw === "tbd") {
    return { status: "notStarted", statusDetail: "" };
  }

  if (raw === "1h") return { status: "live", statusDetail: "1. omgang" };
  if (raw === "2h") return { status: "live", statusDetail: "2. omgang" };
  if (raw === "ht") return { status: "live", statusDetail: "Pause" };
  if (raw === "et") return { status: "live", statusDetail: "Ekstraomgang" };
  if (raw.includes("live")) return { status: "live", statusDetail: "LIVE" };

  const minutesSinceStart = (Date.now() - startUTC.getTime()) / 60000;
  if (minutesSinceStart < 0) return { status: "notStarted", statusDetail: "" };
  if (minutesSinceStart > 150) return { status: "finished", statusDetail: "Slutt" };
  if (hasScore) {
    if (minutesSinceStart < 50) return { status: "live", statusDetail: "1. omgang" };
    if (minutesSinceStart < 65) return { status: "live", statusDetail: "Pause" };
    return { status: "live", statusDetail: "2. omgang" };
  }
  return { status: "notStarted", statusDetail: "" };
}

function osloDateOf(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Europe/Oslo" });
}

function osloHourOf(date: Date): number {
  const h = date.toLocaleTimeString("en-GB", {
    timeZone: "Europe/Oslo",
    hour: "2-digit",
    hour12: false,
  });
  return parseInt(h, 10);
}

async function fetchEventsDay(utcDate: string): Promise<SportsDbEvent[]> {
  const url = `https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${utcDate}&s=Soccer`;
  const res = await fetchWithTimeout(url, {}, 15000);
  if (!res.ok) throw new Error(`thesportsdb ${res.status}`);
  const raw = (await res.json()) as { events?: SportsDbEvent[] | null };
  return raw.events ?? [];
}

async function fetchTeamNext(teamId: string): Promise<SportsDbEvent[]> {
  const url = `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${teamId}`;
  try {
    const res = await fetchWithTimeout(url, {}, 15000);
    if (!res.ok) return [];
    const raw = (await res.json()) as { events?: SportsDbEvent[] | null };
    return raw.events ?? [];
  } catch {
    return [];
  }
}

async function fetchTeamLast(teamId: string): Promise<SportsDbEvent[]> {
  const url = `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`;
  try {
    const res = await fetchWithTimeout(url, {}, 15000);
    if (!res.ok) return [];
    const raw = (await res.json()) as { results?: SportsDbEvent[] | null };
    return raw.results ?? [];
  } catch {
    return [];
  }
}

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cache.data, { headers: CACHE_HEADERS });
  }

  try {
    const now = new Date();
    const todayOslo = osloDateOf(now);
    const tomorrowDate = new Date(now);
    tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
    const tomorrowOslo = osloDateOf(tomorrowDate);
    const yesterdayDate = new Date(now);
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);

    const todayUTC = now.toISOString().split("T")[0];
    const tomorrowUTC = tomorrowDate.toISOString().split("T")[0];
    const yesterdayUTC = yesterdayDate.toISOString().split("T")[0];

    const teamIds = config.football?.followTeamIds ?? [];
    const [evsYesterday, evsToday, evsTomorrow, ...evsTeams] = await Promise.all([
      fetchEventsDay(yesterdayUTC),
      fetchEventsDay(todayUTC),
      fetchEventsDay(tomorrowUTC),
      ...teamIds.flatMap((id) => [fetchTeamNext(id), fetchTeamLast(id)]),
    ]);

    const byId = new Map<string, SportsDbEvent>();
    for (const e of [...evsYesterday, ...evsToday, ...evsTomorrow, ...evsTeams.flat()]) {
      if (e.idEvent) byId.set(e.idEvent, e);
    }

    const matches: FootballMatch[] = Array.from(byId.values())
      .filter(
        (e) =>
          e.strHomeTeam &&
          e.strAwayTeam &&
          e.strTimestamp &&
          isAllowedLeague(e.strLeague ?? "")
      )
      .map((e) => {
        const startUTC = new Date(`${e.strTimestamp}Z`);
        const homeScore = parseScore(e.intHomeScore);
        const awayScore = parseScore(e.intAwayScore);
        const { status, statusDetail } = deriveStatus(
          startUTC,
          homeScore !== null && awayScore !== null,
          e.strStatus
        );
        const notStarted = status === "notStarted";
        const kickoff = startUTC.toLocaleTimeString("no-NO", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Oslo",
        });
        return {
          id: Number(e.idEvent) || 0,
          home: e.strHomeTeam!,
          away: e.strAwayTeam!,
          homeScore: notStarted ? null : homeScore,
          awayScore: notStarted ? null : awayScore,
          status,
          statusDetail,
          tournament: e.strLeague ?? "Fotball",
          kickoff,
          _t: startUTC.getTime(),
          _osloDate: osloDateOf(startUTC),
          _osloHour: osloHourOf(startUTC),
        };
      })
      .filter((m) => {
        if (m._osloDate === todayOslo) return true;
        if (m._osloDate === tomorrowOslo && m._osloHour < NEXT_DAY_CUTOFF_HOUR) return true;
        return false;
      })
      .sort((a, b) => a._t - b._t)
      .map(({ _t, _osloDate, _osloHour, ...m }) => m); // eslint-disable-line @typescript-eslint/no-unused-vars

    const data: FootballData = { matches };
    cache = { data, fetchedAt: Date.now() };
    return NextResponse.json(data, { headers: CACHE_HEADERS });
  } catch {
    if (cache) return NextResponse.json(cache.data, { headers: CACHE_HEADERS });
    return NextResponse.json(
      { error: "Kunne ikke hente fotballkamper" },
      { status: 503, headers: ERROR_HEADERS }
    );
  }
}
