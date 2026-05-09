import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatBox } from './stat-box.component';

describe('StatBox', () => {
  let component: StatBox;
  let fixture: ComponentFixture<StatBox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatBox],
    }).compileComponents();

    fixture = TestBed.createComponent(StatBox);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

