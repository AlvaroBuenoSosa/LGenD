import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Player } from '../../../../shared/models/player.model';

@Component({
  selector: 'app-player-matches',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-matches.component.html',
  styleUrls: ['./player-matches.component.scss']
})
export class PlayerMatchesComponent {

  @Input()
  player!: Player;

}