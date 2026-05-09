import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerWeaponCard } from './player-weapon-card.component';

describe('PlayerWeaponCard', () => {
  let component: PlayerWeaponCard;
  let fixture: ComponentFixture<PlayerWeaponCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerWeaponCard],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerWeaponCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

