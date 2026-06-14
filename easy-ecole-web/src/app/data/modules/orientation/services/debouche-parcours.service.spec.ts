import { TestBed } from '@angular/core/testing';

import { DeboucheParcoursService } from './debouche-parcours.service';

describe('DeboucheParcoursService', () => {
  let service: DeboucheParcoursService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeboucheParcoursService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
