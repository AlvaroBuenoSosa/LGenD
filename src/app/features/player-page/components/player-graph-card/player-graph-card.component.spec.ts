import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerGraphCard } from './player-graph-card.component';

describe('PlayerGraphCard', () => {
  let component: PlayerGraphCard;
  let fixture: ComponentFixture<PlayerGraphCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerGraphCard],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerGraphCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

