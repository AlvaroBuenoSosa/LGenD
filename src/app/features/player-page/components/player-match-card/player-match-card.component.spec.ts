import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerMatchCard } from './player-match-card.component';

describe('PlayerMatchCard', () => {
  let component: PlayerMatchCard;
  let fixture: ComponentFixture<PlayerMatchCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerMatchCard],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerMatchCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

