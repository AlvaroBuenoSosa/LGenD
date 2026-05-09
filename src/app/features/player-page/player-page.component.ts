import { Component, inject, PLATFORM_ID } from '@angular/core';

import {
  ActivatedRoute,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import {
  switchMap,
  of,
  shareReplay
} from 'rxjs';

import { PlayerService } from '../../core/services/player.service';

// COMPONENTS
import { PlayerHeaderComponent } from './components/player-header/player-header.component';
import { PlayerRanksComponent } from './components/player-ranks/player-ranks.component';
import { PlayerNavbarComponent } from './components/player-navbar/player-navbar.component';
import { PlayerOverviewComponent } from './components/player-overview/player-overview.component';
import { PlayerStatsComponent } from './components/player-stats/player-stats.component';
import { PlayerWeaponsComponent } from "./components/player-weapons/player-weapons.component";
import { PlayerMapsComponent } from "./components/player-maps/player-maps.component";
import { PlayerMatchesComponent } from "./components/player-matches/player-matches.component";

@Component({
  standalone: true,
  selector: 'app-player-page',

  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    PlayerHeaderComponent,
    PlayerRanksComponent,
    PlayerNavbarComponent,
    PlayerOverviewComponent,
    PlayerStatsComponent,
    PlayerWeaponsComponent,
    PlayerMapsComponent,
    PlayerMatchesComponent
],

  templateUrl: './player-page.component.html',
  styleUrls: ['./player-page.component.scss']
})
export class PlayerPageComponent {

  private route = inject(ActivatedRoute);
  private service = inject(PlayerService);
  private platformId = inject(PLATFORM_ID);

  player$ = this.route.paramMap.pipe(

    switchMap(params => {

      const steamId = params.get('steamId');

      if (!steamId) {
        throw new Error('steamId required');
      }

      // SSR SAFE
      if (!isPlatformBrowser(this.platformId)) {
        return of(null);
      }

      return this.service.getPlayer(steamId);

    }),

    shareReplay(1)

  );

}