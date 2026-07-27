import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DossierInscriptionService } from './dossier-inscription.service';

describe('DossierInscriptionService', () => {
  let service: DossierInscriptionService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(DossierInscriptionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
