import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Player } from '../../../../shared/models/player.model';

// IMPORT CORRECTO
import { PlayerStatCircleComponent } from '../player-stat-circle/player-stat-circle.component';

@Component({
  selector: 'app-player-overview',
  standalone: true,

  imports: [

    CommonModule,

    // REQUIRED
    PlayerStatCircleComponent

  ],

  templateUrl: './player-overview.component.html',

  styleUrls: ['./player-overview.component.scss']

})
export class PlayerOverviewComponent {

  @Input({ required: true })

  player!: Player;

}

