import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RevuesDirectionPageComponent } from './revues-direction-page.component';
import { QualiteRevueDirectionService } from 'src/app/data/modules/qualite/services/qualite-non-conformite.service';
import { of } from 'rxjs';

describe('RevuesDirectionPageComponent', () => {
  let component: RevuesDirectionPageComponent;
  let fixture: ComponentFixture<RevuesDirectionPageComponent>;

  beforeEach(async () => {
    const svcSpy = jasmine.createSpyObj('QualiteRevueDirectionService', ['getAll', 'create', 'update', 'delete']);
    svcSpy.getAll.and.returnValue(of([{ id: '1', titre: 'Revue S1 2026', dateTenue: new Date(), participants: 'Directeur, Responsable qualité', statut: 'planifiee' }]));

    await TestBed.configureTestingModule({
      declarations: [RevuesDirectionPageComponent],
      imports: [HttpClientTestingModule, FormsModule],
      providers: [{ provide: QualiteRevueDirectionService, useValue: svcSpy }]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RevuesDirectionPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
  it('charge les revues', () => {
    expect(component.items.length).toBe(1);
    expect(component.items[0].titre).toBe('Revue S1 2026');
  });
});
