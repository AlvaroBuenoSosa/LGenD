import { Routes } from '@angular/router';

import { HomeComponent } from './features/home/home.component';

import { PlayerPageComponent } from './features/player-page/player-page.component';

import { PlayerStatsComponent } from './features/player-page/components/player-stats/player-stats.component';
import { PlayerGraphsComponent } from './features/player-page/components/player-graphs/player-graphs.component';
import { PlayerWeaponsComponent } from './features/player-page/components/player-weapons/player-weapons.component';
import { PlayerMapsComponent } from './features/player-page/components/player-maps/player-maps.component';
import { PlayerMatchesComponent } from './features/player-page/components/player-matches/player-matches.component';
import { PlayerTeammatesComponent } from './features/player-page/components/player-teammates/player-teammates.component';

export const routes: Routes = [

  // HOME
  {
    path: '',
    component: HomeComponent
  },

  // PLAYER PAGE
  {
    path: 'player/:steamId',
    component: PlayerPageComponent,

    children: [

      // DEFAULT TAB
      {
        path: '',
        redirectTo: 'stats',
        pathMatch: 'full'
      },

      // STATS
      {
        path: 'stats',
        component: PlayerStatsComponent
      },

      // GRAPHS
      {
        path: 'graphs',
        component: PlayerGraphsComponent
      },

      // WEAPONS
      {
        path: 'weapons',
        component: PlayerWeaponsComponent
      },

      // MAPS
      {
        path: 'maps',
        component: PlayerMapsComponent
      },

      // MATCHES
      {
        path: 'matches',
        component: PlayerMatchesComponent
      },

      // PLAYED WITH
      {
        path: 'teammates',
        component: PlayerTeammatesComponent
      }

    ]
  },

  // REDIRECT OLD URLS
  {
    path: 'players/:steamId',
    redirectTo: 'player/:steamId',
    pathMatch: 'full'
  },

  // FALLBACK
  {
    path: '**',
    redirectTo: ''
  }

];
