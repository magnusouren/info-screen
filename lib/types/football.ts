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
