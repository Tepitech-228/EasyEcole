import { TestBed } from '@angular/core/testing';

import { PaiementInscriptionService } from './paiement-inscription.service';

describe('PaiementInscriptionService', () => {
  let service: PaiementInscriptionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaiementInscriptionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
