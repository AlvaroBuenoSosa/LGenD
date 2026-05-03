import { Component, Input } from '@angular/core';
import { Player } from '../../../../shared/models/player.model';

@Component({
  selector: 'app-player-graphs',
  standalone: true,
  template: `
    <div class="card">
      <h3>Graphs</h3>
      <p>Coming soon...</p>
    </div>
  `
})
export class PlayerGraphsComponent {
  @Input() player!: Player;
}

