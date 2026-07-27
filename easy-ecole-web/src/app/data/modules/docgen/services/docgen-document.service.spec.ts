import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DocGenDocumentService } from './docgen-document.service';
import { environment } from 'src/environments/environment';

describe('DocGenDocumentService', () => {
  let service: DocGenDocumentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(DocGenDocumentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(service).toBeTruthy());

  it('getAll avec params', () => {
    service.getAll({ typeId: '1' }).subscribe();
    const req = httpMock.expectOne(`${environment.API_URL}/docgen/documents?typeId=1`);
    expect(req.request.method).toBe('GET');
  });

  it('getById appelle GET /docgen/documents/:id', () => {
    service.getById('5').subscribe();
    httpMock.expectOne(`${environment.API_URL}/docgen/documents/5`);
  });

  it('generate appelle POST /docgen/documents/generate', () => {
    const data = { typeCode: 'BULLETIN', sourceType: 'inscription', sourceId: 10 };
    service.generate(data).subscribe();
    const req = httpMock.expectOne(`${environment.API_URL}/docgen/documents/generate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(data);
  });

  it('download appelle GET /docgen/documents/:id/download avec responseType blob', () => {
    service.download('3').subscribe();
    const req = httpMock.expectOne(`${environment.API_URL}/docgen/documents/3/download`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
  });

  it('delete appelle DELETE /docgen/documents/:id', () => {
    service.delete('2').subscribe();
    httpMock.expectOne(`${environment.API_URL}/docgen/documents/2`);
  });
});
