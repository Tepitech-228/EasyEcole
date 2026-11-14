import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RolesUtilisateur } from 'src/app/data/enums/RolesUtilisateur';
import { Utilisateur } from 'src/app/data/modules/auth/models/Utilisateur.model';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { CursusApprenant } from 'src/app/data/modules/inscription/models/CursusApprenant.model';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { EcueService } from 'src/app/data/modules/inscription/services/ecue.service';
import { CursusApprenantService } from 'src/app/data/modules/inscription/services/cursus-apprenant.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { EnseignantService } from 'src/app/data/modules/auth/services/enseignant.service';
import { ListeCoursPageComponent } from './liste-cours-page.component';

describe('ListeCoursPageComponent', () => {
  let component: ListeCoursPageComponent;
  let fixture: ComponentFixture<ListeCoursPageComponent>;
  let niveauEtudeService: jasmine.SpyObj<NiveauEtudeService>;
  let coursService: jasmine.SpyObj<CoursService>;
  let ecueService: jasmine.SpyObj<EcueService>;
  let cursusApprenantService: jasmine.SpyObj<CursusApprenantService>;
  let parcoursService: jasmine.SpyObj<ParcoursService>;
  let enseignantService: jasmine.SpyObj<EnseignantService>;

  beforeEach(async () => {
    niveauEtudeService = jasmine.createSpyObj('NiveauEtudeService', ['getAll']);
    coursService = jasmine.createSpyObj('CoursService', ['getAll']);
    ecueService = jasmine.createSpyObj('EcueService', ['getAll']);
    cursusApprenantService = jasmine.createSpyObj('CursusApprenantService', ['getCoursChoisis']);
    parcoursService = jasmine.createSpyObj('ParcoursService', ['getAll']);
    enseignantService = jasmine.createSpyObj('EnseignantService', ['getAll']);

    niveauEtudeService.getAll.and.returnValue(of([]));
    coursService.getAll.and.returnValue(of([]));
    cursusApprenantService.getCoursChoisis.and.returnValue(of(null));
    parcoursService.getAll.and.returnValue(of([]));
    enseignantService.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [ ListeCoursPageComponent ],
      imports: [ CommonModule, FormsModule, ReactiveFormsModule, RouterTestingModule ],
      providers: [
        { provide: NiveauEtudeService, useValue: niveauEtudeService },
        { provide: CoursService, useValue: coursService },
        { provide: EcueService, useValue: ecueService },
        { provide: CursusApprenantService, useValue: cursusApprenantService },
        { provide: ParcoursService, useValue: parcoursService },
        { provide: EnseignantService, useValue: enseignantService },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  });

  beforeEach(() => {
    BaseComponentClass.utilisateur = new Utilisateur();
  });

  afterEach(() => {
    BaseComponentClass.utilisateur = new Utilisateur();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(ListeCoursPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('loads all UEs from the learner selected pathway', () => {
    BaseComponentClass.utilisateur.role = RolesUtilisateur.APPRENANT;
    const cursus = new CursusApprenant();
    cursus.parcoursId = 'filiere-1';
    const coursFiliere: Cours[] = [
      { id: 'ue-1', parcoursId: 'filiere-1', parcours: { id: 'filiere-1', titre: 'Filière 1' } },
      { id: 'ue-2', parcoursId: 'filiere-1', parcours: { id: 'filiere-1', titre: 'Filière 1' } },
      { id: 'ue-3', parcoursId: 'filiere-2', parcours: { id: 'filiere-2', titre: 'Filière 2' } },
    ];
    cursusApprenantService.getCoursChoisis.and.returnValue(of({
      cursusApprenant: cursus,
      coursParticipants: [],
      coursChoisis: [],
    }));
    coursService.getAll.and.returnValue(of(coursFiliere));
    parcoursService.getAll.and.returnValue(of([
      { id: 'filiere-1', titre: 'Filière 1' },
      { id: 'filiere-2', titre: 'Filière 2' },
    ]));

    fixture = TestBed.createComponent(ListeCoursPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(coursService.getAll).toHaveBeenCalledWith('filiere-1');
    expect(component.selectedParcours).toBe('filiere-1');
    expect(component._cours.map(cours => cours.id)).toEqual(['ue-1', 'ue-2']);
    expect(component._parcours.map(parcours => parcours.id)).toEqual(['filiere-1']);
  });
});
