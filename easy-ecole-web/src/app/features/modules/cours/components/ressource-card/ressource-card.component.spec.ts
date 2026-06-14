import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RessourceCardComponent } from './ressource-card.component';

describe('RessourceCardComponent', () => {
  let component: RessourceCardComponent;
  let fixture: ComponentFixture<RessourceCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RessourceCardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RessourceCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
