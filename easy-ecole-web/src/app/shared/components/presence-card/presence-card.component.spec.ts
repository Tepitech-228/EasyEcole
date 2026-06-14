import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PresenceCardComponent } from './presence-card.component';

describe('PresenceCardComponent', () => {
  let component: PresenceCardComponent;
  let fixture: ComponentFixture<PresenceCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PresenceCardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PresenceCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
