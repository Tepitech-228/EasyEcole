import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuiviEcheancesPageComponent } from './suivi-echeances-page.component';

describe('SuiviEcheancesPageComponent', () => {
  let component: SuiviEcheancesPageComponent;
  let fixture: ComponentFixture<SuiviEcheancesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuiviEcheancesPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuiviEcheancesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
