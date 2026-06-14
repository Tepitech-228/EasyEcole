import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsPresencePageComponent } from './details-presence-page.component';

describe('DetailsPresencePageComponent', () => {
  let component: DetailsPresencePageComponent;
  let fixture: ComponentFixture<DetailsPresencePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailsPresencePageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailsPresencePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
