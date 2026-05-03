import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { SteamPlayerDto } from '../dto/steam-player.dto';

@Injectable({ providedIn: 'root' })
export class SteamApiService {
  private http = inject(HttpClient);

  getPlayerSummary(steamId: string) {
    return this.http
      .get<{ steam: SteamPlayerDto }>(`/api/player/${steamId}`)
      .pipe(
        map(response => {
          const player = response?.steam;
          if (!player) {
            throw new Error('Player data missing in API response');
          }
          return player;
        })
      );
  }
}
