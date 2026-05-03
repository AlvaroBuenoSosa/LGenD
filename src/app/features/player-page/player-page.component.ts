import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { switchMap } from 'rxjs';

import { PlayerService } from '../../core/services/player.service';

// COMPONENTS
import { PlayerHeaderComponent } from './components/player-header/player-header.component';
import { PlayerRanksComponent } from './components/player-ranks/player-ranks.component';

@Component({
  standalone: true,
  selector: 'app-player-page',
  imports: [
    AsyncPipe,
    NgIf,
    RouterLink,
    RouterOutlet,
    PlayerHeaderComponent,
    PlayerRanksComponent
  ],
  templateUrl: './player-page.component.html',
  styleUrls: ['./player-page.component.scss']
})
export class PlayerPageComponent {

  private route = inject(ActivatedRoute);
  private service = inject(PlayerService);

  player$ = this.route.paramMap.pipe(
    switchMap(params => {
      const steamId = params.get('steamId');
      if (!steamId) throw new Error('steamId required');
      return this.service.getPlayer(steamId);
    })
  );
}
