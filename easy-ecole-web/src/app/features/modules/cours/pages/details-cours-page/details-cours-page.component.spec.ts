import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';

import { DetailsCoursPageComponent } from './details-cours-page.component';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { Ecue } from 'src/app/data/modules/inscription/models/Ecue.model';

describe('DetailsCoursPageComponent', () => {
  let component: DetailsCoursPageComponent;
  let fixture: ComponentFixture<DetailsCoursPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailsCoursPageComponent ],
      imports: [ HttpClientTestingModule, RouterTestingModule ],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'test' } } } }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailsCoursPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── GETTERS DE SÉCURITÉ ──────────────────────────────────────────

  it('should return empty array for chapitres when cours is undefined', () => {
    expect(component.chapitres).toEqual([]);
  });

  it('should return empty array for ecuesSafe when ecues is empty', () => {
    expect(component.ecuesSafe).toEqual([]);
  });

  it('should return empty array for ecuesSafe when ecues is null', () => {
    (component as any).ecues = null;
    expect(component.ecuesSafe).toEqual([]);
  });

  // ── GETTERS DE CALCUL ────────────────────────────────────────────

  it('should return 0 for all totals when ecues is empty', () => {
    expect(component.totalCmHoraire).toBe(0);
    expect(component.totalTdTpHoraire).toBe(0);
    expect(component.totalTpeHoraire).toBe(0);
    expect(component.totalHoraire).toBe(0);
    expect(component.totalCreditEcts).toBe(0);
    expect(component.totalCoefficient).toBe(0);
    expect(component.ecuesCount).toBe(0);
  });

  it('should compute correct totals from ecues', () => {
    const ecue: Ecue = {
      id: '1', code: 'ALGO1', libelle: 'Algorithmique',
      creditEcts: 3, coefficient: 2, cmHoraire: 20, tdTpHoraire: 10, tpeHoraire: 5, type: 'F'
    };
    (component as any).ecues = [ecue];

    expect(component.totalCmHoraire).toBe(20);
    expect(component.totalTdTpHoraire).toBe(10);
    expect(component.totalTpeHoraire).toBe(5);
    expect(component.totalHoraire).toBe(35);
    expect(component.totalCreditEcts).toBe(3);
    expect(component.totalCoefficient).toBe(2);
    expect(component.ecuesCount).toBe(1);
  });

  it('should ignore undefined hour fields when computing totals', () => {
    const ecue: Ecue = {
      id: '2', code: 'MATH1', libelle: 'Mathématiques',
      creditEcts: 4, coefficient: 3, cmHoraire: undefined, tdTpHoraire: undefined, tpeHoraire: undefined, type: 'T'
    };
    (component as any).ecues = [ecue];

    expect(component.totalCmHoraire).toBe(0);
    expect(component.totalHoraire).toBe(0);
    expect(component.totalCreditEcts).toBe(4);
  });

it('should return empty string from nomEnseignantResponsable when cours has no enseignant', () => {
     expect(component.nomEnseignantResponsable()).toBe('---');
   });

   // ── ECUE TOTAL HORAIRE ────────────────────────────────────

   it('should compute total horaire of an ECUE', () => {
     const ecue: Ecue = { cmHoraire: 20, tdTpHoraire: 10, tpeHoraire: 5 };
     expect(component.ecueTotalHoraire(ecue)).toBe(35);
   });

   it('should treat undefined hour fields as 0 in ecueTotalHoraire', () => {
     const ecue: Ecue = { cmHoraire: undefined, tdTpHoraire: undefined, tpeHoraire: undefined };
     expect(component.ecueTotalHoraire(ecue)).toBe(0);
   });

   it('should return 0 for ecueTotalHoraire on empty fields', () => {
     expect(component.ecueTotalHoraire({})).toBe(0);
   });
});
