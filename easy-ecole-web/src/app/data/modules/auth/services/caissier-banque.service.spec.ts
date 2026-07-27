import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CaissierBanqueService } from './caissier-banque.service';

describe('CaissierBanqueService', () => {
  let service: CaissierBanqueService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(CaissierBanqueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
