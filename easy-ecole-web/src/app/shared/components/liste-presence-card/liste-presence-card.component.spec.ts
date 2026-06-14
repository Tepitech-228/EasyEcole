import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListePresenceCardComponent } from './liste-presence-card.component';

describe('ListePresenceCardComponent', () => {
  let component: ListePresenceCardComponent;
  let fixture: ComponentFixture<ListePresenceCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListePresenceCardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListePresenceCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
