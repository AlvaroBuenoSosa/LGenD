import { Component, Input } from '@angular/core';
import { Player } from '../../../../shared/models/player.model';

@Component({
  selector: 'app-player-maps',
  standalone: true,
  templateUrl: './player-maps.component.html',
  styleUrls: ['./player-maps.component.scss']
})
export class PlayerMapsComponent {
  @Input() player!: Player;
}
