import { Component, Input } from '@angular/core';
import { Player } from '../../../../shared/models/player.model';

@Component({
  selector: 'app-player-weapons',
  standalone: true,
  templateUrl: './player-weapons.component.html',
  styleUrls: ['./player-weapons.component.scss']
})
export class PlayerWeaponsComponent {
  @Input() player!: Player;
}
