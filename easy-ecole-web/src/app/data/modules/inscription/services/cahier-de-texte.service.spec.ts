import { TestBed } from '@angular/core/testing';

import { CahierDeTexteService } from './cahier-de-texte.service';

describe('CahierDeTexteService', () => {
  let service: CahierDeTexteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CahierDeTexteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
