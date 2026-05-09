import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Player } from '../../../../shared/models/player.model';

@Component({
  selector: 'app-player-stats',
  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './player-stats.component.html',
  styleUrls: ['./player-stats.component.scss']
})
export class PlayerStatsComponent {

  @Input({ required: true })
  player!: Player;

  getRatingClass(rating: number): string {

    if (rating >= 1.3) {
      return 'green';
    }

    if (rating >= 1.1) {
      return 'lightgreen';
    }

    if (rating >= 0.9) {
      return 'orange';
    }

    return 'red';
  }

}





