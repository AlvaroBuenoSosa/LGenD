export interface FaceitProfile {
  country: string;
  nickname: string;
}

export interface FaceitLifetime {
  kills: number;
  deaths: number;
  matches: number;
  wins: number;
  kd: number;
  adr: number;
  hsPercent: number;
  winRate: number;
}

export interface FaceitPerformance {
  matches: number;
  wins: number;
  kd: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  rating: number;
  form: number[];
  avgAdr: number;
  avgHsPercent: number;
  avgClutchSuccess: number;
  avgEntrySuccess: number;
  weaponStats: unknown[];
  mapStats: unknown[];
  matchDetails: unknown[];
}

export interface PlayerStats {
  kd: number;
  adr: number;
  winRate: number;
  matches: number;
  wins: number;
  hs: number;
  rating: number;
}

export interface Player {
  steamId: string;
  name: string;
  avatar: string | null;
  profileUrl: string | null;
  faceit: {
    elo: number;
    level: number;
    profile: FaceitProfile;
    lifetime: FaceitLifetime;
  };
  csstats: {
    kills: number;
    deaths: number;
    matches: number;
    wins: number;
    kd: number;
    winRate: number;
  };
  faceitPerformance: FaceitPerformance;
  stats: PlayerStats;
}
