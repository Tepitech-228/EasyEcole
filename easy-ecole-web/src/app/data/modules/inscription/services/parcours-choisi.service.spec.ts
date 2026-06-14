import { TestBed } from '@angular/core/testing';

import { ParcoursChoisiService } from './parcours-choisi.service';

describe('ParcoursChoisiService', () => {
  let service: ParcoursChoisiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ParcoursChoisiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
