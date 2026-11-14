import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AuthService } from 'src/app/data/modules/auth/services/auth.service';
import { SeanceService } from 'src/app/data/modules/inscription/services/seance.service';
import { PlanningEvent } from 'src/app/data/modules/inscription/models/Seance.model';

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
