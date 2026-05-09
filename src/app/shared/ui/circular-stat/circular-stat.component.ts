import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-circular-stat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './circular-stat.component.html',
  styleUrls: ['./circular-stat.component.scss']
})
export class CircularStatComponent {

  @Input() value = 0;
  @Input() label = '';

  radius = 52;
  circumference = 2 * Math.PI * this.radius;

  get offset(): number {
    const progress = Math.min(this.value, 100);
    return this.circumference - (progress / 100) * this.circumference;
  }

}