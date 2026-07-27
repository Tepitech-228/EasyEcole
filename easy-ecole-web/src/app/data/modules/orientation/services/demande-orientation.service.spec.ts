import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DemandeOrientationService } from './demande-orientation.service';

describe('DemandeOrientationService', () => {
  let service: DemandeOrientationService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(DemandeOrientationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
