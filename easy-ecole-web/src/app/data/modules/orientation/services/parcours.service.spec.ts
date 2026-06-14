import { TestBed } from '@angular/core/testing';

import { ParcoursService } from './parcours.service';

describe('ParcoursService', () => {
  let service: ParcoursService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ParcoursService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
