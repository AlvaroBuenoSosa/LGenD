import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Player } from '../../../../shared/models/player.model';

@Component({
  selector: 'app-player-weapons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-weapons.component.html',
  styleUrls: ['./player-weapons.component.scss']
})
export class PlayerWeaponsComponent {

  @Input()
  player!: Player;

}