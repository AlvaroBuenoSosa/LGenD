import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { map } from 'rxjs/operators';

import { Player } from '../../shared/models/player.model';

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
                perf.weaponStats || [],

              mapStats:
                perf.mapStats || [],

              matchDetails:
                perf.matchDetails || []

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

}