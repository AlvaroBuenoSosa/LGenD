import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Player } from '../../../../shared/models/player.model';

@Component({
  selector: 'app-player-ranks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-ranks.component.html',
  styleUrls: ['./player-ranks.component.scss']
})
export class PlayerRanksComponent {

  @Input({ required: true })
  player!: Player;

}
