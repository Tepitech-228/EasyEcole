import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DocGenTemplateService } from './docgen-template.service';
import { environment } from 'src/environments/environment';

describe('DocGenTemplateService', () => {
  let service: DocGenTemplateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(DocGenTemplateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(service).toBeTruthy());

  it('getAll sans typeId appelle GET /docgen/templates', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne(`${environment.API_URL}/docgen/templates`);
    expect(req.request.method).toBe('GET');
  });

  it('getAll avec typeId ajoute query param', () => {
    service.getAll('2').subscribe();
    const req = httpMock.expectOne(`${environment.API_URL}/docgen/templates?typeId=2`);
    expect(req.request.method).toBe('GET');
  });

  it('getById appelle GET /docgen/templates/:id', () => {
    service.getById('1').subscribe();
    httpMock.expectOne(`${environment.API_URL}/docgen/templates/1`);
  });

  it('create appelle POST /docgen/templates', () => {
    service.create({ libelle: 'Test' }).subscribe();
    const req = httpMock.expectOne(`${environment.API_URL}/docgen/templates`);
    expect(req.request.method).toBe('POST');
  });

  it('update appelle PUT /docgen/templates/:id', () => {
    service.update('1', { contenu: 'x' }).subscribe();
    httpMock.expectOne(`${environment.API_URL}/docgen/templates/1`);
  });

  it('delete appelle DELETE /docgen/templates/:id', () => {
    service.delete('1').subscribe();
    httpMock.expectOne(`${environment.API_URL}/docgen/templates/1`);
  });

  it('preview appelle POST /docgen/templates/preview avec responseType text', () => {
    service.preview('test', {}).subscribe();
    const req = httpMock.expectOne(`${environment.API_URL}/docgen/templates/preview`);
    expect(req.request.method).toBe('POST');
    expect(req.request.responseType).toBe('text');
  });
});
