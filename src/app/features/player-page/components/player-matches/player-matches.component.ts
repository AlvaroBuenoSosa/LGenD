import { Component, Input } from '@angular/core';
import { Player } from '../../../../shared/models/player.model';

@Component({
  selector: 'app-player-matches',
  standalone: true,
  templateUrl: './player-matches.component.html',
  styleUrls: ['./player-matches.component.scss']
})
export class PlayerMatchesComponent {
  @Input() player!: Player;
}