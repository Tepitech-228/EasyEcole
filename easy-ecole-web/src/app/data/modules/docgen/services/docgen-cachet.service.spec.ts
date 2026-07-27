import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DocGenCachetService } from './docgen-cachet.service';
import { environment } from 'src/environments/environment';

describe('DocGenCachetService', () => {
  let service: DocGenCachetService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(DocGenCachetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(service).toBeTruthy());

  it('getAll appelle GET /docgen/cachets', () => {
    service.getAll().subscribe();
    httpMock.expectOne(`${environment.API_URL}/docgen/cachets`);
  });

  it('getActive appelle GET /docgen/cachets/active', () => {
    service.getActive().subscribe();
    httpMock.expectOne(`${environment.API_URL}/docgen/cachets/active`);
  });

  it('upload appelle POST /docgen/cachets/upload avec FormData', () => {
    const fd = new FormData();
    fd.append('test', 'value');
    service.upload(fd).subscribe();
    const req = httpMock.expectOne(`${environment.API_URL}/docgen/cachets/upload`);
    expect(req.request.method).toBe('POST');
  });

  it('update appelle PUT /docgen/cachets/:id', () => {
    service.update('1', { libelle: 'Cachet test' }).subscribe();
    httpMock.expectOne(`${environment.API_URL}/docgen/cachets/1`);
  });

  it('setActive appelle PUT /docgen/cachets/:id/active', () => {
    service.setActive('1').subscribe();
    const req = httpMock.expectOne(`${environment.API_URL}/docgen/cachets/1/active`);
    expect(req.request.method).toBe('PUT');
  });

  it('delete appelle DELETE /docgen/cachets/:id', () => {
    service.delete('1').subscribe();
    httpMock.expectOne(`${environment.API_URL}/docgen/cachets/1`);
  });
});
