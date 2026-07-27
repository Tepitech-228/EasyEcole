import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DocGenSigningService } from './docgen-signing.service';
import { environment } from 'src/environments/environment';

describe('DocGenSigningService', () => {
  let service: DocGenSigningService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(DocGenSigningService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(service).toBeTruthy());

  it('getPendingForTeacher appelle GET /docgen/signatures/pending/enseignant', () => {
    service.getPendingForTeacher().subscribe();
    httpMock.expectOne(`${environment.API_URL}/docgen/signatures/pending/enseignant`);
  });

  it('getPendingForDirector appelle GET /docgen/signatures/pending/direction', () => {
    service.getPendingForDirector().subscribe();
    httpMock.expectOne(`${environment.API_URL}/docgen/signatures/pending/direction`);
  });

  it('getDocumentsByClasse envoie params', () => {
    service.getDocumentsByClasse('6e').subscribe();
    const req = httpMock.expectOne(`${environment.API_URL}/docgen/signatures/documents/6e`);
    expect(req.request.method).toBe('GET');
  });

  it('getDocumentsByClasse avec statut', () => {
    service.getDocumentsByClasse('6e', 'signé').subscribe();
    httpMock.expectOne(r => r.url.includes('/documents/6e') && r.params.get('statut') === 'signé');
  });

  it('signBatch appelle POST /docgen/signatures/batch', () => {
    service.signBatch([1, 2], 10, 'enseignant').subscribe();
    const req = httpMock.expectOne(`${environment.API_URL}/docgen/signatures/batch`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ documentIds: [1, 2], signataireId: 10, signataireType: 'enseignant' });
  });
});
