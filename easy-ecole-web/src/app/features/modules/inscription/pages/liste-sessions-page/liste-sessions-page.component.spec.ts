import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { PermissionStateService } from 'src/app/core/services/permission-state.service';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';

import { ListeSessionsPageComponent } from './liste-sessions-page.component';

describe('ListeSessionsPageComponent', () => {
  let component: ListeSessionsPageComponent;
  let fixture: ComponentFixture<ListeSessionsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListeSessionsPageComponent ],
      imports: [FormsModule, ReactiveFormsModule],
      providers: [
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        {
          provide: SessionService,
          useValue: {
            getAll: () => of({ data: [], pagination: { total: 0, totalPages: 1 } }),
            create: () => of({ id: '1' }),
            update: () => of({}),
            delete: () => of({ success: true })
          }
        },
        { provide: NiveauEtudeService, useValue: { getAll: () => of([]) } },
        { provide: AnneeAcademiqueService, useValue: { getAll: () => of([]) } },
        {
          provide: PermissionStateService,
          useValue: {
            ensureLoaded: () => of(undefined),
            hasPermission: () => true
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListeSessionsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows edit and delete actions only when the matching permissions are present', () => {
    expect(component.canShowSessionAction({}, 'edit')).toBeTrue();
    expect(component.canShowSessionAction({}, 'delete')).toBeTrue();

    component.canModifySession = false;
    component.canDeleteSession = false;

    expect(component.canShowSessionAction({}, 'edit')).toBeFalse();
    expect(component.canShowSessionAction({}, 'delete')).toBeFalse();
    expect(component.canShowSessionAction({}, 'details')).toBeTrue();
  });
});
