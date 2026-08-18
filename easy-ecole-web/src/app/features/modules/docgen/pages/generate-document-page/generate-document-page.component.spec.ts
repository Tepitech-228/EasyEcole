import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { GenerateDocumentPageComponent } from './generate-document-page.component';
import { DocGenDocumentService } from 'src/app/data/modules/docgen/services/docgen-document.service';
import { DocGenTypeService } from 'src/app/data/modules/docgen/services/docgen-type.service';
import { BordereauService } from 'src/app/data/modules/inscription/services/bordereau.service';
import { DemandeDocumentService } from 'src/app/data/modules/scolarite/services/demande-document.service';
import { TypeDocumentService } from 'src/app/data/modules/scolarite/services/type-document.service';

describe('GenerateDocumentPageComponent', () => {
  let component: GenerateDocumentPageComponent;
  let fixture: ComponentFixture<GenerateDocumentPageComponent>;

  beforeEach(async () => {
    const docgenDocSpy = jasmine.createSpyObj('DocGenDocumentService', ['getAll', 'generate', 'download']);
    const typeSpy = jasmine.createSpyObj('DocGenTypeService', ['getAll']);
    const bordereauSpy = jasmine.createSpyObj('BordereauService', ['getAll']);
    const demandeSpy = jasmine.createSpyObj('DemandeDocumentService', ['getAll', 'confirmerPaiement', 'updateStatus']);
    const typeDocSpy = jasmine.createSpyObj('TypeDocumentService', ['getAll', 'create', 'update', 'delete']);

    typeSpy.getAll.and.returnValue(of([{ id: '1', code: 'REC001', libelle: 'Reçu de scolarité' }]));
    typeDocSpy.getAll.and.returnValue(of([{ id: '1', libelle: 'Attestation', frais: 5000 }]));
    bordereauSpy.getAll.and.returnValue(of({ data: [], pagination: { total: 0 } }));
    demandeSpy.getAll.and.returnValue(of({ data: [], pagination: { total: 0 } }));
    docgenDocSpy.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [GenerateDocumentPageComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule],
      providers: [
        { provide: DocGenDocumentService, useValue: docgenDocSpy },
        { provide: DocGenTypeService, useValue: typeSpy },
        { provide: BordereauService, useValue: bordereauSpy },
        { provide: DemandeDocumentService, useValue: demandeSpy },
        { provide: TypeDocumentService, useValue: typeDocSpy }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GenerateDocumentPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('charge les listes au démarrage', () => {
    expect(component.typesDocument.length).toBe(1);
  });

  it('detecte la présence du type Reçu de scolarité (REC001)', () => {
    expect(component.recuTypePresent).toBeTrue();
  });

  it('genererRecu sans type présent affiche une erreur claire', () => {
    component.recuTypePresent = false;
    component.genererRecu({ id: '1', montant: 50000 } as any);
    expect(component.errorMessage).toContain('REC001');
  });

  it('genererRecu en erreur met à jour errorMessage', () => {
    const svc = TestBed.inject(DocGenDocumentService) as jasmine.SpyObj<DocGenDocumentService>;
    svc.generate.and.returnValue(throwError(() => new Error('Erreur test')));
    component.genererRecu({ id: '1', montant: 50000 } as any);
    expect(component.errorMessage).toContain('Erreur test');
  });

  it('saveType sans libellé affiche une erreur', () => {
    component.typeForm = { libelle: '', frais: 0 };
    component.saveType();
    expect(component.errorMessage).toContain('libellé');
  });
});