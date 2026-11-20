import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AuthService } from 'src/app/data/modules/auth/services/auth.service';
import { SeanceService } from 'src/app/data/modules/inscription/services/seance.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { SalleDeClasseService } from 'src/app/data/modules/inscription/services/salle-de-classe.service';
import { PlanningEvent } from 'src/app/data/modules/inscription/models/Seance.model';
import { BaseComponentClass } from 'src/app/core/base-component-class';

import { ListeEmploisDuTempsPageComponent } from './liste-emplois-du-temps-page.component';

describe('ListeEmploisDuTempsPageComponent', () => {
  let component: ListeEmploisDuTempsPageComponent;
  let fixture: ComponentFixture<ListeEmploisDuTempsPageComponent>;
  const authServiceMock = {
    getSitesMoi: () => of([{ id: 3, nom: 'Campus principal' }])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListeEmploisDuTempsPageComponent ],
      imports: [ HttpClientTestingModule, RouterTestingModule ],
      providers: [{ provide: AuthService, useValue: authServiceMock }]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListeEmploisDuTempsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('allows the general supervisor to manage the schedule', () => {
    component.rolesValue.isSuperviseurGeneral = true;

    expect(component.peutGererPlanning).toBe(true);
  });

  it('allows administrators to manage the schedule', () => {
    component.rolesValue.isAdmin = true;

    expect(component.peutGererPlanning).toBe(true);
  });

  it('loads authorized sites even when the displayed week has no schedule events', () => {
    expect(component.planningEvents).toEqual([]);
    expect(component.sitesPlanning).toEqual([{ id: 3, nom: 'Campus principal' }]);
  });

  it('keeps the selected site and displays only its schedule events', () => {
    const seanceService = TestBed.inject(SeanceService);
    spyOn(seanceService, 'getPlanning').and.returnValue(of([
      {
        id: 'event-3',
        titre: 'Séance du site sélectionné',
        date: '2026-11-20',
        jourSemaine: '5',
        heureDebut: new Date('2026-11-20T08:00:00'),
        heureFin: new Date('2026-11-20T09:00:00'),
        salle: 'A1',
        etablissementId: 3,
      },
      {
        id: 'event-4',
        titre: 'Séance d’un autre site',
        date: '2026-11-20',
        jourSemaine: '5',
        heureDebut: new Date('2026-11-20T09:00:00'),
        heureFin: new Date('2026-11-20T10:00:00'),
        salle: 'B1',
        etablissementId: 4,
      },
    ]));

    component.onPlanningSiteChange('3');

    expect(component.filterSiteId).toBe('3');
    expect(component.calendarOptions?.events).toEqual([
      jasmine.objectContaining({ title: 'Séance du site sélectionné' }),
    ]);
  });

  it('loads classes and rooms for the active site', () => {
    BaseComponentClass.utilisateur.etablissementId = 3;
    component.sitesDisponibles = [{ id: 3, nom: 'Campus principal' }];
    const classeService = TestBed.inject(ClasseService);
    const salleService = TestBed.inject(SalleDeClasseService);
    const loadClasses = spyOn(classeService, 'getAll').and.returnValue(of([]));
    const loadSalles = spyOn(salleService, 'getAll').and.returnValue(of([]));

    component.getClasses();
    component.getSalles();

    expect(loadClasses).toHaveBeenCalledOnceWith(undefined, '3');
    expect(loadSalles).toHaveBeenCalledOnceWith(undefined, undefined, '3', undefined, undefined, 'DISPONIBLE');
  });

  it('includes the selected class in the session payload', () => {
    component.nouvelleSeanceForm.patchValue({
      classeGroupeId: '12',
      salleDeClasseId: '5',
      salle: 'A1',
    });

    const payload = (component as any).collectFormData(component.nouvelleSeanceForm);

    expect(payload.classeGroupeId).toBe('12');
  });

  it('asks for a reason before submitting an early course end', () => {
    const seanceService = TestBed.inject(SeanceService);
    const pointerFin = spyOn(seanceService, 'pointerFin').and.returnValue(of({ message: 'Fin enregistrée' }));
    const today = new Date().toISOString().slice(0, 10);
    const event: PlanningEvent = {
      id: 'event-1',
      seanceId: '7',
      titre: 'Algorithmique',
      date: today,
      jourSemaine: '2',
      heureDebut: new Date(),
      heureFin: new Date(`${today}T23:59:59.000Z`),
      salle: 'A1',
    };

    component.pointerSeance(event, 'fin');

    expect(component.finAnticipeeEnAttente).toBe(event);
    expect(pointerFin).not.toHaveBeenCalled();

    component.motifDepart = 'Raison de service';
    component.confirmerFinAnticipee();

    expect(pointerFin).toHaveBeenCalledOnceWith('7', event.date, 'Raison de service');
    expect(component.finAnticipeeEnAttente).toBeNull();
  });
});
