import { Component, Input } from '@angular/core';
import { Player } from '../../../../shared/models/player.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-player-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-header.component.html',
  styleUrls: ['./player-header.component.scss']
})
export class PlayerHeaderComponent {
  @Input() player!: Player;
}
