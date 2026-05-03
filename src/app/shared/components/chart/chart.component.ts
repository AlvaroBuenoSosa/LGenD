import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="chart-card" *ngIf="items.length">
      <h3>{{ title }}</h3>
      <ul>
        <li *ngFor="let item of items">
          <span>{{ item.label }}</span>
          <div class="bar">
            <div class="fill" [style.width.%]="normalize(item.value)"></div>
          </div>
          <strong>{{ item.value | number:'1.0-2' }}</strong>
        </li>
      </ul>
    </section>
  `,
  styles: [
    ".chart-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 1rem; padding: 1rem; margin-top: 1.5rem; }",
    ".chart-card h3 { margin: 0 0 1rem; font-size: 1.05rem; }",
    ".chart-card ul { display: grid; gap: 0.8rem; list-style: none; padding: 0; margin: 0; }",
    ".chart-card li { display: grid; grid-template-columns: 1fr auto; gap: 0.75rem; align-items: center; }",
    ".chart-card span { color: rgba(255,255,255,0.75); }",
    ".bar { height: 0.6rem; width: 100%; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden; }",
    ".fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #ec4899); border-radius: 999px; }"
  ]
})
export class ChartComponent {
  @Input() title = '';
  @Input() items: Array<{ label: string; value: number }> = [];

  normalize(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
    return Math.min(100, Math.max(0, value));
  }
}
