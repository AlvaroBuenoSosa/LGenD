import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-player-stat-circle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-stat-circle.component.html',
  styleUrls: ['./player-stat-circle.component.scss']
})
export class PlayerStatCircleComponent {

  @Input()
  label: string = '';

  @Input()
  value: number = 0;

  @Input()
  max: number = 100;

  @Input()
  color: string = '#4ade80';

  // ESTE ES EL FIX
  @Input()
  displayValue: string | number = '';

  get percentage(): number {

    return Math.min(
      (this.value / this.max) * 100,
      100
    );

  }

}