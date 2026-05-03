import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  template: `
    <div class="shell">
      <app-navbar></app-navbar>
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    ".shell { min-height: 100vh; display: flex; flex-direction: column; }",
    "main { flex: 1; width: min(100%, 1200px); margin: 0 auto; padding: 1rem 1.5rem; }"
  ]
})
export class ShellComponent {}
