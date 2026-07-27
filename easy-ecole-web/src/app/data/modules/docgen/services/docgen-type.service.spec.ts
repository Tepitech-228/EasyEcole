import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DocGenTypeService } from './docgen-type.service';
import { environment } from 'src/environments/environment';

describe('DocGenTypeService', () => {
  let service: DocGenTypeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(DocGenTypeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(service).toBeTruthy());

  it('getAll appelle GET /docgen/types', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne(`${environment.API_URL}/docgen/types`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getById appelle GET /docgen/types/:id', () => {
    service.getById('1').subscribe();
    const req = httpMock.expectOne(`${environment.API_URL}/docgen/types/1`);
    expect(req.request.method).toBe('GET');
  });

  it('create appelle POST /docgen/types', () => {
    service.create({ code: 'TEST' }).subscribe();
    const req = httpMock.expectOne(`${environment.API_URL}/docgen/types`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ code: 'TEST' });
  });

  it('update appelle PUT /docgen/types/:id', () => {
    service.update('1', { libelle: 'Test' }).subscribe();
    const req = httpMock.expectOne(`${environment.API_URL}/docgen/types/1`);
    expect(req.request.method).toBe('PUT');
  });

  it('delete appelle DELETE /docgen/types/:id', () => {
    service.delete('1').subscribe();
    const req = httpMock.expectOne(`${environment.API_URL}/docgen/types/1`);
    expect(req.request.method).toBe('DELETE');
  });
});
