import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SignaturesPageComponent } from './signatures-page.component';
import { DocGenSigningService } from 'src/app/data/modules/docgen/services/docgen-signing.service';
import { of } from 'rxjs';

describe('SignaturesPageComponent', () => {
  let component: SignaturesPageComponent;
  let fixture: ComponentFixture<SignaturesPageComponent>;

  beforeEach(async () => {
    const signingServiceSpy = jasmine.createSpyObj('DocGenSigningService', ['getPendingForTeacher', 'getDocumentsByClasse', 'signBatch']);
    signingServiceSpy.getPendingForTeacher.and.returnValue(of([{ classe: '6e', count: 3 }]));
    signingServiceSpy.getDocumentsByClasse.and.returnValue(of([{ id: 1, statut: 'en_attente_enseignant' }]));

    await TestBed.configureTestingModule({
      declarations: [SignaturesPageComponent],
      imports: [HttpClientTestingModule],
      providers: [{ provide: DocGenSigningService, useValue: signingServiceSpy }]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SignaturesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('charge les groupes au démarrage', () => {
    expect(component.groupes.length).toBe(1);
    expect(component.groupes[0].classe).toBe('6e');
  });

  it('selectClasse charge les documents', () => {
    component.selectClasse('5e');
    const svc = TestBed.inject(DocGenSigningService) as jasmine.SpyObj<DocGenSigningService>;
    expect(svc.getDocumentsByClasse).toHaveBeenCalledWith('5e', 'en_attente_enseignant');
  });

  it('pendingCount filtre en_attente_enseignant', () => {
    component.documents = [
      { statut: 'en_attente_enseignant' },
      { statut: 'signé' },
      { statut: 'en_attente_enseignant' }
    ] as any;
    expect(component.pendingCount).toBe(2);
  });
});
