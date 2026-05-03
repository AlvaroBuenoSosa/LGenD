import { Component, Input } from '@angular/core';
import { Player } from '../../../../shared/models/player.model';

@Component({
  selector: 'app-player-ranks',
  standalone: true,
  templateUrl: './player-ranks.component.html',
  styleUrls: ['./player-ranks.component.scss']
})
export class PlayerRanksComponent {
  @Input() player: Player | null = null;
}
