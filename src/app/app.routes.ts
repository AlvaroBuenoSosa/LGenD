import { Routes } from '@angular/router';
import { PlayerPageComponent } from './features/player-page/player-page.component';

import { PlayerStatsComponent } from './features/player-page/components/player-stats/player-stats.component';
import { PlayerGraphsComponent } from './features/player-page/components/player-graphs/player-graphs.component';
import { PlayerWeaponsComponent } from './features/player-page/components/player-weapons/player-weapons.component';
import { PlayerMapsComponent } from './features/player-page/components/player-maps/player-maps.component';
import { PlayerMatchesComponent } from './features/player-page/components/player-matches/player-matches.component';
import { PlayerTeammatesComponent } from './features/player-page/components/player-teammates/player-teammates.component';

import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },

  {
    path: 'players/:steamId',
    component: PlayerPageComponent,
    children: [
      { path: '', redirectTo: 'stats', pathMatch: 'full' },
      { path: 'stats', component: PlayerStatsComponent },
      { path: 'graphs', component: PlayerGraphsComponent },
      { path: 'weapons', component: PlayerWeaponsComponent },
      { path: 'maps', component: PlayerMapsComponent },
      { path: 'matches', component: PlayerMatchesComponent },
      { path: 'teammates', component: PlayerTeammatesComponent }
    ]
  },

  { path: '**', redirectTo: '' }
];
