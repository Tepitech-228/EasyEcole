import { TestBed } from '@angular/core/testing';

import { ProgressInterceptorService } from './progress-interceptor.service';

describe('ProgressInterceptorService', () => {
  let service: ProgressInterceptorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProgressInterceptorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
