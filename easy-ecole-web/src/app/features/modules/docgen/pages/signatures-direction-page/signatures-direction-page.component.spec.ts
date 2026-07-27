import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SignaturesDirectionPageComponent } from './signatures-direction-page.component';
import { DocGenSigningService } from 'src/app/data/modules/docgen/services/docgen-signing.service';
import { of } from 'rxjs';

describe('SignaturesDirectionPageComponent', () => {
  let component: SignaturesDirectionPageComponent;
  let fixture: ComponentFixture<SignaturesDirectionPageComponent>;

  beforeEach(async () => {
    const signingServiceSpy = jasmine.createSpyObj('DocGenSigningService', ['getPendingForDirector', 'getDocumentsByClasse', 'signBatch']);
    signingServiceSpy.getPendingForDirector.and.returnValue(of([{ classe: '6e', count: 5 }]));

    await TestBed.configureTestingModule({
      declarations: [SignaturesDirectionPageComponent],
      imports: [HttpClientTestingModule],
      providers: [{ provide: DocGenSigningService, useValue: signingServiceSpy }]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SignaturesDirectionPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('charge les groupes direction au démarrage', () => {
    expect(component.groupes.length).toBe(1);
  });

  it('pendingCount filtre en_attente_directeur', () => {
    component.documents = [
      { statut: 'en_attente_directeur' },
      { statut: 'en_attente_enseignant' }
    ] as any;
    expect(component.pendingCount).toBe(1);
  });
});
