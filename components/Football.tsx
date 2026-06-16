"use client";

import { useEffect, useState } from "react";
import { SoccerBall } from "@phosphor-icons/react";
import type { FootballData, FootballMatch } from "@/lib/types/football";

function StatusBadge({ match }: { match: FootballMatch }) {
  const s = match.status;
  if (s === "notStarted") {
    return (
      <span className="text-text-3 text-xs tabular-nums">
        {match.kickoff ?? "—"}
      </span>
    );
  }
  if (s === "finished") {
    return <span className="text-text-4 text-xs">Slutt</span>;
  }
  if (s === "inprogress" || s === "live" || s === "playing") {
    return (
      <span className="text-live text-xs font-medium tabular-nums">
        {match.statusDetail || "LIVE"}
      </span>
    );
  }
  return (
    <span className="text-text-3 text-xs tabular-nums">
      {match.statusDetail || "—"}
    </span>
  );
}

function Score({ match }: { match: FootballMatch }) {
  if (match.homeScore === null || match.awayScore === null) {
    return <span className="text-text-5 text-sm">–</span>;
  }
  return (
    <span className="text-text-2 text-sm tabular-nums">
      {match.homeScore}–{match.awayScore}
    </span>
  );
}

function MatchRow({ match }: { match: FootballMatch }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr_auto] items-baseline gap-2 py-1">
      <div className="text-text-2 text-sm font-light truncate text-right">
        {match.home}
      </div>
      <Score match={match} />
      <div className="text-text-2 text-sm font-light truncate">
        {match.away}
      </div>
      <div className="justify-self-end">
        <StatusBadge match={match} />
      </div>
    </div>
  );
}

export default function Football() {
  const [data, setData] = useState<FootballData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/football");
        if (!res.ok) throw new Error();
        setData(await res.json());
        setError(false);
      } catch {
        setError(true);
      }
    };
    load();
    const id = setInterval(load, 3 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (!data) {
    return (
      <div>
        <div className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest mb-3">
          <SoccerBall size={13} weight="light" />
          Fotball i dag
        </div>
        <div className="text-text-5 text-sm animate-pulse">
          {error ? "Fotballdata utilgjengelig" : "Laster kamper…"}
        </div>
      </div>
    );
  }

  if (!data.matches.length) {
    return (
      <div>
        <div className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest mb-3">
          <SoccerBall size={13} weight="light" />
          Fotball i dag
        </div>
        <div className="text-text-4 text-xs font-light">
          Ingen kamper i dag
        </div>
      </div>
    );
  }

  const byTournament = new Map<string, FootballMatch[]>();
  for (const m of data.matches) {
    const list = byTournament.get(m.tournament) ?? [];
    list.push(m);
    byTournament.set(m.tournament, list);
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest mb-3">
        <SoccerBall size={13} weight="light" />
        Fotball i dag
      </div>
      <div className="space-y-3">
        {Array.from(byTournament.entries()).map(([tournament, matches]) => (
          <div key={tournament}>
            <div className="text-text-4 text-[10px] uppercase tracking-wider mb-1">
              {tournament}
            </div>
            {matches.map((m) => (
              <MatchRow key={m.id} match={m} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
