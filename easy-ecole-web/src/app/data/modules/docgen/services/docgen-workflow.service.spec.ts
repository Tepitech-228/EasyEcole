import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DocGenWorkflowService } from './docgen-workflow.service';
import { environment } from 'src/environments/environment';

describe('DocGenWorkflowService', () => {
  let service: DocGenWorkflowService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(DocGenWorkflowService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(service).toBeTruthy());

  it('getByType appelle GET /docgen/workflows/type/:typeId', () => {
    service.getByType('3').subscribe();
    const req = httpMock.expectOne(`${environment.API_URL}/docgen/workflows/type/3`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('save appelle POST /docgen/workflows', () => {
    const data = { typeId: '1', steps: [{ etape: 1, role: 'enseignant' }] };
    service.save(data as any).subscribe();
    const req = httpMock.expectOne(`${environment.API_URL}/docgen/workflows`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(data);
    req.flush({});
  });

  it('delete appelle DELETE /docgen/workflows/:id', () => {
    service.delete('5').subscribe();
    const req = httpMock.expectOne(`${environment.API_URL}/docgen/workflows/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
