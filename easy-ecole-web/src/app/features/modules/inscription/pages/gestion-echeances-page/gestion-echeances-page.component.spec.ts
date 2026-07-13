import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionEcheancesPageComponent } from './gestion-echeances-page.component';

describe('GestionEcheancesPageComponent', () => {
  let component: GestionEcheancesPageComponent;
  let fixture: ComponentFixture<GestionEcheancesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GestionEcheancesPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GestionEcheancesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
