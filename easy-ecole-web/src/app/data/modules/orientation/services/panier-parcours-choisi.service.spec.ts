import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PanierParcoursChoisiService } from './panier-parcours-choisi.service';

describe('PanierParcoursChoisiService', () => {
  let service: PanierParcoursChoisiService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(PanierParcoursChoisiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
