import { TestBed } from '@angular/core/testing';

import { ReponseInscriptionService } from './reponse-inscription.service';

describe('ReponseInscriptionService', () => {
  let service: ReponseInscriptionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReponseInscriptionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
