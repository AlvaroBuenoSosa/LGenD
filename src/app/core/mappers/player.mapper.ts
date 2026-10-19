import {
  Player,
  PlayerWeaponHeadshots,
  PlayerWeaponKill
} from '../../shared/models/player.model';

type FaceitLifetimeRaw = Record<string, unknown>;

type FaceitPerformanceRaw = {
  matches?: unknown;
  wins?: unknown;
  kd?: unknown;
  winRate?: unknown;
  avgKills?: unknown;
  avgDeaths?: unknown;
  rating?: unknown;
  form?: unknown;
  avgAdr?: unknown;
  avgHsPercent?: unknown;
  avgClutchSuccess?: unknown;
  avgEntrySuccess?: unknown;
  weaponStats?: unknown;
  mapStats?: unknown;
  matchDetails?: unknown;
};

export class PlayerMapper {

  static toDomain(dto: unknown): Player {

    const data = dto as any;

    const n = (v: unknown): number => {
      const num = Number(v);
      return Number.isFinite(num) ? num : 0;
    };

    const steam = data?.steam ?? {};
    const faceit = data?.faceit ?? {};
    const cs = data?.csstats ?? {};
    const perf: FaceitPerformanceRaw = data?.faceitPerformance ?? {};

    const elo = n(faceit?.profile?.games?.cs2?.faceit_elo);

    const getLevelFromElo = (elo: number): number => {
      if (elo >= 2000) return 10;
      if (elo >= 1750) return 9;
      if (elo >= 1500) return 8;
      if (elo >= 1250) return 7;
      if (elo >= 1050) return 6;
      if (elo >= 900) return 5;
      if (elo >= 750) return 4;
      if (elo >= 600) return 3;
      if (elo >= 400) return 2;
      return 1;
    };

    const lifetimeRaw: FaceitLifetimeRaw = faceit?.stats?.lifetime ?? {};

    const faceitLifetime = {
      kills: n(lifetimeRaw["Kills"]),
      deaths: n(lifetimeRaw["Deaths"]),
      matches: n(lifetimeRaw["Matches"]),
      wins: n(lifetimeRaw["Wins"]),

      kd: n(
        lifetimeRaw["Average K/D Ratio"] ??
        lifetimeRaw["K/D Ratio"] ??
        lifetimeRaw["KD"]
      ),

      adr: n(lifetimeRaw["ADR"]),

      hsPercent: n(
        lifetimeRaw["Average Headshots %"] ??
        lifetimeRaw["HS %"]
      ),

      winRate: n(
        lifetimeRaw["Win Rate %"] ??
        lifetimeRaw["Win Rate"]
      )
    };

    const faceitProfile = {
      country: faceit?.profile?.country ?? 'Unknown',
      nickname: faceit?.profile?.nickname ?? 'Unknown'
    };

    const csstats = {
      kills: n(cs.kills),
      deaths: n(cs.deaths),
      matches: n(cs.matches),
      wins: n(cs.wins),
      kd: n(cs.kd),
      winRate: n(cs.winRate)
    };

    const rawWeaponStats = perf.weaponStats;
    const weaponStatsObject =
      typeof rawWeaponStats === 'object' &&
      rawWeaponStats !== null &&
      !Array.isArray(rawWeaponStats)
        ? rawWeaponStats as Record<string, unknown>
        : {};

    const normalizeWeaponEntries = <T>(
      value: unknown,
      statKey: 'kills' | 'hsPercent',
      makeWeapon: (name: string, imageId: string, stat: number) => T
    ): T[] => {
      if (!Array.isArray(value)) return [];

      return value.flatMap((entry: unknown) => {
        if (typeof entry !== 'object' || entry === null) return [];

        const weapon = entry as Record<string, unknown>;
        if (typeof weapon['name'] !== 'string' || typeof weapon['imageId'] !== 'string') {
          return [];
        }

        const stat = n(weapon[statKey]);
        return stat > 0
          ? [makeWeapon(weapon['name'], weapon['imageId'], stat)]
          : [];
      });
    };

    const faceitPerformance = {
      matches: n(perf.matches),
      wins: n(perf.wins),
      kd: n(perf.kd),
      winRate: n(perf.winRate),
      avgKills: n(perf.avgKills),
      avgDeaths: n(perf.avgDeaths),
      rating: n(perf.rating),
      form: Array.isArray(perf.form)
        ? perf.form.map((v: unknown) => (v ? 1 : 0))
        : [],
      avgAdr: n(perf.avgAdr),
      avgHsPercent: n(perf.avgHsPercent),
      avgClutchSuccess: n(perf.avgClutchSuccess),
      avgEntrySuccess: n(perf.avgEntrySuccess),
      weaponStats: {
        mostKills: normalizeWeaponEntries(
          weaponStatsObject['mostKills'],
          'kills',
          (name, imageId, kills): PlayerWeaponKill => ({ name, imageId, kills })
        ),
        hsPercent: normalizeWeaponEntries(
          weaponStatsObject['hsPercent'],
          'hsPercent',
          (name, imageId, hsPercent): PlayerWeaponHeadshots => ({ name, imageId, hsPercent })
        )
      },
      mapStats: Array.isArray(perf.mapStats) ? perf.mapStats : [],
      matchDetails: Array.isArray(perf.matchDetails) ? perf.matchDetails : []
    };

    const stats = {
      kd: csstats.kd,
      adr: faceitLifetime.adr,
      winRate: csstats.winRate,
      matches: csstats.matches,
      wins: csstats.wins,
      hs: faceitLifetime.hsPercent,
      rating: faceitPerformance.rating
    };

    return {
      steamId: steam?.steamid ?? '',
      name: steam?.personaname ?? 'Unknown',
      avatar: steam?.avatarfull ?? null,
      profileUrl: steam?.profileurl ?? null,

      faceit: {
        elo,
        level: getLevelFromElo(elo),
        profile: faceitProfile,
        lifetime: faceitLifetime
      },

      csstats,
      faceitPerformance,
      stats
    };
  }
}
