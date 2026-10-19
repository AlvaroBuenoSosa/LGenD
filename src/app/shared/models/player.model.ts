export interface FaceitProfile {
  country: string;
  nickname: string;
  url?: string;
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
  weaponStats: PlayerWeaponStats;
  mapStats: PlayerMapStats[];
  matchDetails: PlayerMatchDetail[];
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

export interface PlayerWeaponStats {
  mostKills: PlayerWeaponKill[];
  hsPercent: PlayerWeaponHeadshots[];
}

export interface PlayerWeaponStatsJob {
  status: 'processing' | 'complete' | 'partial' | 'failed';
  startedAt: number;
  processedMatches: number;
  totalMatches: number | null;
  analyzedMatches: number;
  failedMatches: number;
  finishedAt: number | null;
  weaponStats: PlayerWeaponStats;
  message: string | null;
}

export interface PlayerMatchmakingWeaponStatsJob {
  status: 'processing' | 'complete' | 'failed';
  startedAt: number;
  finishedAt: number | null;
  weaponStats: PlayerWeaponStats;
  message: string | null;
}

export interface PlayerWeaponKill {
  name: string;
  imageId: string;
  kills: number;
}

export interface PlayerWeaponHeadshots {
  name: string;
  imageId: string;
  hsPercent: number;
}

export interface PlayerMapStats {
  name: string;
  matches: number;
  winRate: number;
  kd: number;
}

export interface PlayerMatchDetail {
  date: string;
  map: string;
  score: string;
  kills: number;
  assists: number;
  deaths: number;
  adr: number;
  hsPercent: number;
  won: boolean;
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
