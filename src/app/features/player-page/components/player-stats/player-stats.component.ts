import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerService } from '../../../../core/services/player.service';

@Component({
  selector: 'app-player-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-stats.component.html',
  styleUrls: ['./player-stats.component.scss']
})
export class PlayerStatsComponent {

  player$ = inject(PlayerService).player$;

  getRatingClass(rating: number): string {
    if (rating >= 1.3) return 'green';
    if (rating >= 1.1) return 'lightgreen';
    if (rating >= 0.9) return 'orange';
    return 'red';
  }
}





