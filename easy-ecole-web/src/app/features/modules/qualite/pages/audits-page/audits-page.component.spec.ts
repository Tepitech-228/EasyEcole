import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuditsPageComponent } from './audits-page.component';
import { QualiteAuditService } from 'src/app/data/modules/qualite/services/qualite-non-conformite.service';
import { of } from 'rxjs';

describe('AuditsPageComponent', () => {
  let component: AuditsPageComponent;
  let fixture: ComponentFixture<AuditsPageComponent>;

  beforeEach(async () => {
    const svcSpy = jasmine.createSpyObj('QualiteAuditService', ['getAll', 'create', 'update', 'delete']);
    svcSpy.getAll.and.returnValue(of([{ id: '1', titre: 'Audit pédagogique', type: 'interne', processus: 'Pédagogie', statut: 'planifie' }]));

    await TestBed.configureTestingModule({
      declarations: [AuditsPageComponent],
      imports: [HttpClientTestingModule, FormsModule],
      providers: [{ provide: QualiteAuditService, useValue: svcSpy }]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AuditsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
  it('charge les audits', () => {
    expect(component.items.length).toBe(1);
    expect(component.items[0].titre).toBe('Audit pédagogique');
  });
  it('ouvrirFormulaire initialise', () => {
    component.ouvrirFormulaire();
    expect(component.showForm).toBeTrue();
    expect(component.formData.type).toBe('interne');
  });
});
