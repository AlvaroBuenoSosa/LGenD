import { Component, Input } from '@angular/core';
import { Player } from '../../../../shared/models/player.model';

@Component({
  selector: 'app-player-teammates',
  standalone: true,
  template: `
    <div class="card">
      <h3>Players</h3>
      <p>Coming soon...</p>
    </div>
  `
})
export class PlayerTeammatesComponent {
  @Input() player!: Player;
}

