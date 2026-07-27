import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DocumentsPageComponent } from './documents-page.component';
import { DocGenDocumentService } from 'src/app/data/modules/docgen/services/docgen-document.service';
import { DocGenTypeService } from 'src/app/data/modules/docgen/services/docgen-type.service';
import { of } from 'rxjs';

describe('DocumentsPageComponent', () => {
  let component: DocumentsPageComponent;
  let fixture: ComponentFixture<DocumentsPageComponent>;

  beforeEach(async () => {
    const docServiceSpy = jasmine.createSpyObj('DocGenDocumentService', ['getAll', 'generate', 'download']);
    docServiceSpy.getAll.and.returnValue(of([{ id: '1', reference: 'DOC-001', statut: 'brouillon' }]));
    docServiceSpy.download.and.returnValue(of(new Blob()));
    const typeServiceSpy = jasmine.createSpyObj('DocGenTypeService', ['getAll']);
    typeServiceSpy.getAll.and.returnValue(of([{ id: '1', code: 'BULLETIN', libelle: 'Bulletin' }]));

    await TestBed.configureTestingModule({
      declarations: [DocumentsPageComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: DocGenDocumentService, useValue: docServiceSpy },
        { provide: DocGenTypeService, useValue: typeServiceSpy }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('charge documents et types au démarrage', () => {
    expect(component.documents.length).toBe(1);
    expect(component.types.length).toBe(1);
  });

  it('download déclenche le téléchargement', () => {
    component.download(component.documents[0]);
    const svc = TestBed.inject(DocGenDocumentService) as jasmine.SpyObj<DocGenDocumentService>;
    expect(svc.download).toHaveBeenCalledWith('1');
  });

  it('getStatutBadge retourne une classe CSS', () => {
    expect(component.getStatutBadge('brouillon')).toContain('bg-gray');
    expect(component.getStatutBadge('signé')).toContain('bg-green');
    expect(component.getStatutBadge('inconnu')).toContain('bg-gray');
  });

  it('getStatutLabel retourne un libellé lisible', () => {
    expect(component.getStatutLabel('brouillon')).toBe('Brouillon');
    expect(component.getStatutLabel('en_attente_enseignant')).toBe('Attente enseignant');
    expect(component.getStatutLabel('signé')).toBe('Signé');
  });

  it('filtrer par recherche', () => {
    component.documents = [
      { id: '1', reference: 'DOC-001' },
      { id: '2', reference: 'DOC-002' }
    ] as any;
    component.search = '002';
    component.filtrer();
    expect(component.filteredDocuments.length).toBe(1);
  });
});
