import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerMapCard } from './player-map-card.component';

describe('PlayerMapCard', () => {
  let component: PlayerMapCard;
  let fixture: ComponentFixture<PlayerMapCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerMapCard],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerMapCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

