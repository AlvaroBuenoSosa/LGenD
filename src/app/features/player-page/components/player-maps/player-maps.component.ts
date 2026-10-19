import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Player } from '../../../../shared/models/player.model';

@Component({
  selector: 'app-player-maps',
  imports: [CommonModule],
  templateUrl: './player-maps.component.html',
  styleUrls: ['./player-maps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerMapsComponent {
  readonly player = input.required<Player>();
}