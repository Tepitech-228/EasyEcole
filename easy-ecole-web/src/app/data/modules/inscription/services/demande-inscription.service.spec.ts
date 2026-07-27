import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DemandeInscriptionService } from './demande-inscription.service';

describe('DemandeInscriptionService', () => {
  let service: DemandeInscriptionService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(DemandeInscriptionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
