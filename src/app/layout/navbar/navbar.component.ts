import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="navbar">
      <a class="brand" routerLink="/">LGenD</a>
      <div class="links">
        <a routerLink="/">Home</a>
        <a href="https://www.faceit.com" target="_blank" rel="noreferrer noopener">Faceit</a>
      </div>
    </nav>
  `,
  styles: [
    ".navbar { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); }",
    ".brand { font-size: 1.1rem; font-weight: 700; color: white; text-decoration: none; }",
    ".links { display: flex; gap: 1rem; }",
    ".links a { color: rgba(255,255,255,0.78); text-decoration: none; font-weight: 600; }",
    ".links a:hover { color: white; }"
  ]
})
export class NavbarComponent {}
