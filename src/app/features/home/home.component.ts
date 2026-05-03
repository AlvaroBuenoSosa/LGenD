import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="home">
      <div class="hero">
        <span class="eyebrow">CS2 player lookup</span>
        <h1>Search Faceit / Steam stats</h1>
        <p>Enter a Steam ID to view Faceit ELO, country, and CS stats in one place.</p>
      </div>

      <form class="search-form" (submit)="search($event)">
        <label>
          Steam ID
          <input
            type="text"
            placeholder="7656119..."
            [(ngModel)]="steamId"
            name="steamId"
            autocomplete="off"
          />
        </label>

        <div class="actions">
          <button type="submit" [disabled]="!steamId.trim()">Search player</button>
        </div>
      </form>

      <div class="hint">
        <p>Need an example? Use a public Steam ID and press Search.</p>
      </div>
    </section>
  `,
  styles: [
    ".home { padding: 2rem 1rem; max-width: 760px; margin: 0 auto; }",
    ".hero { margin-bottom: 2rem; }",
    ".eyebrow { display: inline-flex; padding: 0.25rem 0.75rem; border-radius: 999px; background: rgba(255,255,255,0.08); color: #5eead4; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.12em; }",
    ".hero h1 { font-size: clamp(2.25rem, 4vw, 3.5rem); margin: 1rem 0 0.75rem; }",
    ".hero p { max-width: 40rem; line-height: 1.75; color: rgba(255,255,255,0.72); }",
    ".search-form { display: grid; gap: 1rem; }",
    ".search-form label { display: grid; gap: 0.5rem; font-weight: 600; color: #f8fafc; }",
    ".search-form input { width: 100%; min-height: 3rem; padding: 0.85rem 1rem; border-radius: 0.85rem; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: white; }",
    ".actions { display: flex; justify-content: flex-start; }",
    ".actions button { appearance: none; border: none; border-radius: 0.85rem; padding: 0.95rem 1.4rem; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; font-weight: 700; cursor: pointer; transition: transform 0.2s ease, opacity 0.2s ease; }",
    ".actions button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }",
    ".hint { margin-top: 1.75rem; color: rgba(255,255,255,0.65); }",
  ]
})
export class HomeComponent {
  private router = inject(Router);
  steamId = '';

  search(event: Event) {
    event.preventDefault();
    const trimmed = this.steamId.trim();
    if (trimmed) {
      this.router.navigate(['/players', trimmed]);
    }
  }
}
