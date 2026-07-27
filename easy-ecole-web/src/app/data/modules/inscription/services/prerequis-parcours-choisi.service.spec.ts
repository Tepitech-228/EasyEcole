import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PrerequisParcoursChoisiChoisiService } from './prerequis-parcours-choisi.service';

describe('PrerequisParcoursChoisiChoisiService', () => {
  let service: PrerequisParcoursChoisiChoisiService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(PrerequisParcoursChoisiChoisiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
