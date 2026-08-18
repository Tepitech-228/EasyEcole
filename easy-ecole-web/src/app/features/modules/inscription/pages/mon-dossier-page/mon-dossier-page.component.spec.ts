import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { MonDossierPageComponent } from './mon-dossier-page.component';
import { DossierEtudiantService } from 'src/app/data/modules/inscription/services/dossier-etudiant.service';
import { DocGenDocumentService } from 'src/app/data/modules/docgen/services/docgen-document.service';
import { ToastService } from 'src/app/core/services/toast.service';

describe('MonDossierPageComponent', () => {
  let component: MonDossierPageComponent;
  let fixture: ComponentFixture<MonDossierPageComponent>;

  beforeEach(async () => {
    const dossierServiceSpy = jasmine.createSpyObj('DossierEtudiantService', ['getMonDossier', 'telechargerCarteUrl']);
    dossierServiceSpy.getMonDossier.and.returnValue(of({ id: '1', codeQR: 'QR-1' }));
    dossierServiceSpy.telechargerCarteUrl.and.returnValue('/cartes/1/download');

    const docgenServiceSpy = jasmine.createSpyObj('DocGenDocumentService', ['getMyDocuments', 'generateStudent', 'download']);
    docgenServiceSpy.getMyDocuments.and.returnValue(of({ success: true, data: [] }));
    docgenServiceSpy.generateStudent.and.returnValue(of({ success: true, data: [{ id: 'doc-1', reference: 'REF-1' }] }));
    docgenServiceSpy.download.and.returnValue(of(new Blob()));

    await TestBed.configureTestingModule({
      declarations: [ MonDossierPageComponent ],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: DossierEtudiantService, useValue: dossierServiceSpy },
        { provide: DocGenDocumentService, useValue: docgenServiceSpy },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MonDossierPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
