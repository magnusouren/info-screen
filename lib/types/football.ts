export interface FootballTeam {
  id?: number;
  name: string;
  score?: number | null;
  country?: string;
}

export interface FootballEvent {
  id: number;
  start_date?: string;
  status: string;
  status_detail: string;
  sport: string;
  tournament: string;
  teams: FootballTeam[];
  slug: string;
}

export interface FootballResponse {
  status: string;
  data: {
    events: FootballEvent[];
    total_events: number;
  };
}

export interface FootballMatch {
  id: number;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  statusDetail: string;
  tournament: string;
  kickoff: string | null;
}

export interface FootballData {
  matches: FootballMatch[];
}
