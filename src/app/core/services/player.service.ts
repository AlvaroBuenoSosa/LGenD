import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { catchError, map, switchMap, takeWhile } from 'rxjs/operators';
import { Observable, of, timer, timeout } from 'rxjs';

import {
  Player,
  PlayerMatchDetail,
  PlayerMapStats,
  PlayerWeaponHeadshots,
  PlayerWeaponKill,
  PlayerWeaponStats,
  PlayerWeaponStatsJob,
  PlayerMatchmakingWeaponStatsJob
} from '../../shared/models/player.model';

function normalizeWeaponList<T>(
  value: unknown,
  statistic: 'kills' | 'hsPercent',
  createWeapon: (name: string, imageId: string, value: number) => T
): T[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry: unknown) => {
    if (typeof entry !== 'object' || entry === null) {
      return [];
    }

    const weapon = entry as Record<string, unknown>;
    if (
      typeof weapon['name'] !== 'string' ||
      !weapon['name'].trim() ||
      typeof weapon['imageId'] !== 'string' ||
      !/^[a-z0-9_]+$/i.test(weapon['imageId'])
    ) {
      return [];
    }

    const toNumber = (field: unknown): number => {
      const number = Number(field);
      return Number.isFinite(number) ? number : 0;
    };

    const value = toNumber(weapon[statistic]);
    if (value <= 0) {
      return [];
    }

    return [createWeapon(weapon['name'], weapon['imageId'], value)];
  });
}

function normalizeWeaponStats(value: unknown): PlayerWeaponStats {
  if (Array.isArray(value)) {
    const legacy = normalizeWeaponList(
      value,
      'kills',
      (name, imageId, kills): PlayerWeaponKill => ({ name, imageId, kills })
    );
    return { mostKills: legacy, hsPercent: [] };
  }

  if (typeof value !== 'object' || value === null) {
    return { mostKills: [], hsPercent: [] };
  }

  const weaponStats = value as Record<string, unknown>;
  return {
    mostKills: normalizeWeaponList(
      weaponStats['mostKills'],
      'kills',
      (name, imageId, kills): PlayerWeaponKill => ({ name, imageId, kills })
    ),
    hsPercent: normalizeWeaponList(
      weaponStats['hsPercent'],
      'hsPercent',
      (name, imageId, hsPercent): PlayerWeaponHeadshots => ({ name, imageId, hsPercent })
    )
  };
}

function normalizeMapStats(value: unknown): PlayerMapStats[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry: unknown) => {
    if (typeof entry !== 'object' || entry === null) {
      return [];
    }

    const map = entry as Record<string, unknown>;
    if (typeof map['name'] !== 'string' || !map['name'].trim()) {
      return [];
    }

    const toNumber = (field: unknown): number => {
      const number = Number(field);
      return Number.isFinite(number) ? number : 0;
    };

    return [{
      name: map['name'],
      matches: toNumber(map['matches']),
      winRate: toNumber(map['winRate']),
      kd: toNumber(map['kd'])
    }];
  });
}

function normalizeMatchDetails(value: unknown): PlayerMatchDetail[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry: unknown) => {
    if (typeof entry !== 'object' || entry === null) {
      return [];
    }

    const match = entry as Record<string, unknown>;
    if (typeof match['map'] !== 'string' || !match['map'].trim()) {
      return [];
    }

    const toNumber = (field: unknown): number => {
      const number = Number(field);
      return Number.isFinite(number) ? number : 0;
    };
    const rawDate = match['date'];
    const date = rawDate instanceof Date
      ? rawDate.toISOString()
      : typeof rawDate === 'string' || typeof rawDate === 'number'
        ? String(rawDate)
        : '';

    return [{
      date,
      map: match['map'],
      score: typeof match['score'] === 'string' ? match['score'] : 'N/A',
      kills: toNumber(match['kills']),
      assists: toNumber(match['assists']),
      deaths: toNumber(match['deaths']),
      adr: toNumber(match['adr']),
      hsPercent: toNumber(match['hsPercent']),
      won: match['won'] === true
    }];
  });
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  private http = inject(HttpClient);

  getPlayer(steamId: string) {

    return this.http
      .get<any>(`/api/player/${steamId}`)
      .pipe(

        map(res => {

          // BACKEND NORMALIZADO
          const steam = res || {};
          const faceit = res.faceit || {};
          const profile = faceit.profile || {};
          const lifetime = faceit.lifetime || {};

          const perf = res.faceitPerformance || {};
          const cs = res.csstats || {};

          const player: Player = {

            steamId:
              res.steamId ||
              steamId,

            // =========================
            // INFO GENERAL
            // =========================

            name:
              res.name ||
              profile.nickname ||
              'Unknown',

            avatar:
              res.avatar ||
              null,

            profileUrl:
              res.profileUrl ||
              null,

            // =========================
            // FACEIT
            // =========================

            faceit: {

              // FIX PRINCIPAL
              elo:
                faceit.elo ||
                0,

              // FIX PRINCIPAL
              level:
                faceit.level ||
                1,

              profile: {

                nickname:
                  profile.nickname ||
                  'Unknown',

                country:
                  profile.country ||
                  'Unknown',

                // LINK FACEIT
                url:
                  profile.url ||
                  null

              },

              // =========================
              // LIFETIME STATS
              // =========================

              lifetime: {

                kills:
                  Number(lifetime.kills || 0),

                deaths:
                  Number(lifetime.deaths || 0),

                matches:
                  Number(lifetime.matches || 0),

                wins:
                  Number(lifetime.wins || 0),

                kd:
                  Number(lifetime.kd || 0),

                adr:
                  Number(lifetime.adr || 0),

                hsPercent:
                  Number(lifetime.hsPercent || 0),

                winRate:
                  Number(lifetime.winRate || 0)

              }

            },

            // =========================
            // CSSTATS
            // =========================

            csstats: {

              kills:
                cs.kills || 0,

              deaths:
                cs.deaths || 0,

              matches:
                cs.matches || 0,

              wins:
                cs.wins || 0,

              kd:
                cs.kd || 0,

              winRate:
                cs.winRate || 0

            },

            // =========================
            // PERFORMANCE
            // =========================

            faceitPerformance: {

              matches:
                perf.matches || 0,

              wins:
                perf.wins || 0,

              kd:
                perf.kd || 0,

              winRate:
                perf.winRate || 0,

              avgKills:
                perf.avgKills || 0,

              avgDeaths:
                perf.avgDeaths || 0,

              rating:
                perf.rating || 0,

              form:
                perf.form || [],

              avgAdr:
                perf.avgAdr || 0,

              avgHsPercent:
                perf.avgHsPercent || 0,

              avgClutchSuccess:
                perf.avgClutchSuccess || 0,

              avgEntrySuccess:
                perf.avgEntrySuccess || 0,

              weaponStats:
                normalizeWeaponStats(perf.weaponStats),

              mapStats:
                normalizeMapStats(perf.mapStats),

              matchDetails:
                normalizeMatchDetails(perf.matchDetails)

            },

            // =========================
            // GLOBAL STATS
            // =========================

            stats: {

              kd:
                perf.kd ||
                cs.kd ||
                lifetime.kd ||
                0,

              adr:
                perf.avgAdr ||
                lifetime.adr ||
                0,

              winRate:
                perf.winRate ||
                cs.winRate ||
                lifetime.winRate ||
                0,

              matches:
                perf.matches ||
                cs.matches ||
                lifetime.matches ||
                0,

              wins:
                perf.wins ||
                cs.wins ||
                lifetime.wins ||
                0,

              hs:
                perf.avgHsPercent ||
                lifetime.hsPercent ||
                0,

              rating:
                perf.rating ||
                1

            }

          };

          return player;

        })

      );

  }

  watchWeaponStats(steamId: string): Observable<PlayerWeaponStatsJob> {
    return timer(0, 2500).pipe(
      switchMap(() =>
        this.http.get<PlayerWeaponStatsJob>(`/api/player/${steamId}/weapons`).pipe(
          timeout({ first: 20000 })
        )
      ),
      catchError((error: unknown) => {
        const message = error instanceof HttpErrorResponse
          ? error.status === 0
            ? 'Cannot connect to the backend. Make sure the backend server is running.'
            : error.status === 404
              ? 'The Weapons API route was not found. Restart the backend server to load the latest routes.'
              : `The Weapons API request failed (HTTP ${error.status}).`
          : error instanceof Error && error.name === 'TimeoutError'
            ? 'The backend did not respond within 20 seconds. Check that the backend server is running and reachable.'
            : 'Unable to retrieve weapon analysis status.';
        const now = Date.now();

        return of({
          status: 'failed',
          startedAt: now,
          processedMatches: 0,
          totalMatches: null,
          analyzedMatches: 0,
          failedMatches: 0,
          finishedAt: now,
          weaponStats: { mostKills: [], hsPercent: [] },
          message
        } satisfies PlayerWeaponStatsJob);
      }),
      takeWhile(job => job.status === 'processing', true)
    );
  }

  watchMatchmakingWeaponStats(steamId: string): Observable<PlayerMatchmakingWeaponStatsJob> {
    return timer(0, 2500).pipe(
      switchMap(() =>
        this.http.get<PlayerMatchmakingWeaponStatsJob>(
          `/api/player/${steamId}/weapons/matchmaking`
        ).pipe(timeout({ first: 20000 }))
      ),
      catchError((error: unknown) => {
        const message = error instanceof HttpErrorResponse
          ? error.status === 0
            ? 'Cannot connect to the backend. Make sure the backend server is running.'
            : `The CS2 matchmaking stats request failed (HTTP ${error.status}).`
          : error instanceof Error && error.name === 'TimeoutError'
            ? 'The CS2 matchmaking stats request timed out.'
            : 'Unable to retrieve CS2 matchmaking weapon stats.';
        const now = Date.now();

        return of({
          status: 'failed',
          startedAt: now,
          finishedAt: now,
          weaponStats: { mostKills: [], hsPercent: [] },
          message
        } satisfies PlayerMatchmakingWeaponStatsJob);
      }),
      takeWhile(job => job.status === 'processing', true)
    );
  }

}