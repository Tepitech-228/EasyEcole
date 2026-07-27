import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { FichierRessourceService } from './fichier-ressource.service';

describe('FichierRessourceService', () => {
  let service: FichierRessourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(FichierRessourceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
