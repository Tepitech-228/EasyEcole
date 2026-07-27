import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PaiementInscriptionService } from './paiement-inscription.service';

describe('PaiementInscriptionService', () => {
  let service: PaiementInscriptionService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(PaiementInscriptionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
