import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerOverviewComponent } from './player-overview.component';

describe('PlayerOverviewComponent', () => {
  let component: PlayerOverviewComponent;
  let fixture: ComponentFixture<PlayerOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerOverviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerOverviewComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

