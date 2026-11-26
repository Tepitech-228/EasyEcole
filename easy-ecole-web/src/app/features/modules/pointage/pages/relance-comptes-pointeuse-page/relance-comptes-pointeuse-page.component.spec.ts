import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import {
  HikvisionStaffCandidate,
  HikvisionStudentCandidate,
  PointageService
} from 'src/app/data/modules/inscription/services/pointage.service';
import { RelanceComptesPointeusePageComponent } from './relance-comptes-pointeuse-page.component';

describe('RelanceComptesPointeusePageComponent', () => {
  let fixture: ComponentFixture<RelanceComptesPointeusePageComponent>;
  let pointageService: jasmine.SpyObj<PointageService>;

  const staffCandidate: HikvisionStaffCandidate = {
    utilisateurId: 1,
    nom: 'Ndiaye',
    prenoms: 'Marie',
    role: 'enseignant',
    identifiant: 'marie.ndiaye',
    employeeNo: 'EMP-01',
    photoDisponible: true,
    siteIds: [10],
    sites: [{ id: 10, nom: 'Campus Central' }],
    terminaux: [],
    missingTerminalCount: 0
  };

  const studentCandidate: HikvisionStudentCandidate = {
    key: 'student-1',
    utilisateurId: 2,
    nom: 'Ndiaye',
    prenoms: 'Marie',
    identifiant: 'marie.ndiaye@student.test',
    employeeNo: 'ETU-01',
    siteId: 10,
    siteNom: 'Campus Central',
    photoDisponible: true,
    terminaux: [],
    missingTerminalCount: 0
  };

  beforeEach(async () => {
    pointageService = jasmine.createSpyObj<PointageService>(
      'PointageService',
      ['getComptesPersonnelAEnroler']
    );
    pointageService.getComptesPersonnelAEnroler.and.returnValue(of({
      utilisateurs: [],
      etudiants: [],
      sites: []
    }));

    await TestBed.configureTestingModule({
      declarations: [RelanceComptesPointeusePageComponent],
      providers: [{ provide: PointageService, useValue: pointageService }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(RelanceComptesPointeusePageComponent);
  });

  it('finds personnel and students by reversed, accent-insensitive name words', () => {
    const component = fixture.componentInstance;
    component.candidats = [staffCandidate];
    component.etudiants = [studentCandidate];
    component.searchTerm = 'ndïaye marie';

    expect(component.filteredCandidates).toEqual([staffCandidate]);
    expect(component.filteredStudents).toEqual([studentCandidate]);
  });

  it('searches by site and respects the selected site', () => {
    const component = fixture.componentInstance;
    component.candidats = [staffCandidate];
    component.etudiants = [studentCandidate];
    component.searchTerm = 'campus';

    expect(component.filteredCandidates).toEqual([staffCandidate]);
    expect(component.filteredStudents).toEqual([studentCandidate]);

    component.selectedSiteId = '20';
    expect(component.filteredCandidates).toEqual([]);
    expect(component.filteredStudents).toEqual([]);
  });

  it('labels accounts already present on every active terminal as present', () => {
    const component = fixture.componentInstance;
    const enrolledCandidate: HikvisionStaffCandidate = {
      ...staffCandidate,
      terminaux: [
        {
          id: 1,
          nom: 'Terminal 1',
          etablissementId: 10,
          statut: 'termine',
          compteCree: true,
          derniereErreur: null
        },
        {
          id: 2,
          nom: 'Terminal 2',
          etablissementId: 10,
          statut: 'termine',
          compteCree: true,
          derniereErreur: null
        }
      ]
    };

    expect(component.candidateStatus(enrolledCandidate)).toBe('Présent sur toutes les pointeuses');
  });

  it('keeps already-present personnel visible when filtering by site', () => {
    const component = fixture.componentInstance;
    const enrolledCandidate: HikvisionStaffCandidate = {
      ...staffCandidate,
      terminaux: [{
        id: 1,
        nom: 'Terminal 1',
        etablissementId: 10,
        statut: 'termine',
        compteCree: true,
        derniereErreur: null
      }]
    };
    component.candidats = [enrolledCandidate];
    component.selectedSiteId = '10';

    expect(component.filteredCandidates).toEqual([enrolledCandidate]);
  });
});
