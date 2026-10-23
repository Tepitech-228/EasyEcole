import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';

import { SessionService } from './session.service';

describe('SessionService', () => {
  let service: SessionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SessionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('updates a session by its id', () => {
    const changes = { description: 'Session modifiée' };

    service.update('12', changes).subscribe();

    const request = httpMock.expectOne(`${environment.API_MODULES.INSCRIPTION}/sessions/12`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(changes);
    request.flush({ id: '12', ...changes });
  });

  it('deletes a session by its id', () => {
    service.delete('12').subscribe();

    const request = httpMock.expectOne(`${environment.API_MODULES.INSCRIPTION}/sessions/12`);
    expect(request.request.method).toBe('DELETE');
    request.flush({ success: true });
  });
});
