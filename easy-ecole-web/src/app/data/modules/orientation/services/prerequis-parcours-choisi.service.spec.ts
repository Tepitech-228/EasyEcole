import { TestBed } from '@angular/core/testing';

import { PrerequisParcoursChoisiService } from './prerequis-parcours-choisi.service';

describe('PrerequisParcoursChoisiService', () => {
  let service: PrerequisParcoursChoisiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrerequisParcoursChoisiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
