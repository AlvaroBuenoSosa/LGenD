import { Component, Input } from '@angular/core';
import { Player } from '../../../../shared/models/player.model';

@Component({
  selector: 'app-player-header',
  standalone: true,
  templateUrl: './player-header.component.html',
  styleUrls: ['./player-header.component.scss']
})
export class PlayerHeaderComponent {
  @Input() player!: Player;
}
