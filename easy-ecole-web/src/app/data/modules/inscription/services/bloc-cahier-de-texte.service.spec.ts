import { TestBed } from '@angular/core/testing';

import { BlocCahierDeTexteService } from './bloc-cahier-de-texte.service';

describe('BlocCahierDeTexteService', () => {
  let service: BlocCahierDeTexteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BlocCahierDeTexteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
