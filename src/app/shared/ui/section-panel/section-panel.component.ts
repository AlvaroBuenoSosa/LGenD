import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-section-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-panel.component.html',
  styleUrls: ['./section-panel.component.scss']
})
export class SectionPanelComponent {

  @Input() title = '';

}