import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerNavbarComponent } from './player-navbar.component';

describe('PlayerNavbarComponent', () => {
  let component: PlayerNavbarComponent;
  let fixture: ComponentFixture<PlayerNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerNavbarComponent ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerNavbarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

