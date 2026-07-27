import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { FraisInscriptionService } from './frais-inscription.service';

describe('FraisInscriptionService', () => {
  let service: FraisInscriptionService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(FraisInscriptionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
