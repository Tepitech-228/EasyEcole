import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AuthService } from 'src/app/data/modules/auth/services/auth.service';

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
});
