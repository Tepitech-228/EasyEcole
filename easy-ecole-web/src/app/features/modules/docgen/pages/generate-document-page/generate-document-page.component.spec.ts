import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { GenerateDocumentPageComponent } from './generate-document-page.component';
import { DocGenDocumentService } from 'src/app/data/modules/docgen/services/docgen-document.service';
import { DocGenTypeService } from 'src/app/data/modules/docgen/services/docgen-type.service';
import { of, throwError } from 'rxjs';

describe('GenerateDocumentPageComponent', () => {
  let component: GenerateDocumentPageComponent;
  let fixture: ComponentFixture<GenerateDocumentPageComponent>;

  beforeEach(async () => {
    const docServiceSpy = jasmine.createSpyObj('DocGenDocumentService', ['generate']);
    const typeServiceSpy = jasmine.createSpyObj('DocGenTypeService', ['getAll']);
    typeServiceSpy.getAll.and.returnValue(of([{ id: '1', code: 'BULLETIN', libelle: 'Bulletin de notes' }]));

    await TestBed.configureTestingModule({
      declarations: [GenerateDocumentPageComponent],
      imports: [HttpClientTestingModule, ReactiveFormsModule],
      providers: [
        { provide: DocGenDocumentService, useValue: docServiceSpy },
        { provide: DocGenTypeService, useValue: typeServiceSpy }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GenerateDocumentPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('charge les types au démarrage', () => {
    expect(component.types.length).toBe(1);
  });

  it('generate réinitialise result et error avant appel', () => {
    component.result = { id: '1' };
    component.error = 'ancienne erreur';
    const svc = TestBed.inject(DocGenDocumentService) as jasmine.SpyObj<DocGenDocumentService>;
    svc.generate.and.returnValue(of({ id: '2' } as any));
    component.form.patchValue({ typeCode: 'BULLETIN' });
    component.generate();
    expect(component.result).toBeNull();
  });

  it('generate en erreur met à jour error', () => {
    const svc = TestBed.inject(DocGenDocumentService) as jasmine.SpyObj<DocGenDocumentService>;
    svc.generate.and.returnValue(throwError(() => new Error('Erreur test')));
    component.form.patchValue({ typeCode: 'BULLETIN' });
    component.generate();
    expect(component.error).toContain('Erreur test');
  });

  it('formulaire invalide ne déclenche pas la génération', () => {
    const svc = TestBed.inject(DocGenDocumentService) as jasmine.SpyObj<DocGenDocumentService>;
    component.generate();
    expect(svc.generate).not.toHaveBeenCalled();
  });
});
