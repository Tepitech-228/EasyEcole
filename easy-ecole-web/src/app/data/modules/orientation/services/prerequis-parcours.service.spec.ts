import { TestBed } from '@angular/core/testing';

import { PrerequisParcoursService } from './prerequis-parcours.service';

describe('PrerequisParcoursService', () => {
  let service: PrerequisParcoursService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrerequisParcoursService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
