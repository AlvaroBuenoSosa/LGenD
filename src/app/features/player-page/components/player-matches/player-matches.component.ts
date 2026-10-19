import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Player } from '../../../../shared/models/player.model';

@Component({
  selector: 'app-player-matches',
  imports: [CommonModule],
  templateUrl: './player-matches.component.html',
  styleUrls: ['./player-matches.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerMatchesComponent {
  readonly player = input.required<Player>();
  readonly recentMatches = computed(() =>
    [...this.player().faceitPerformance.matchDetails]
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
      .slice(0, 5)
  );
}