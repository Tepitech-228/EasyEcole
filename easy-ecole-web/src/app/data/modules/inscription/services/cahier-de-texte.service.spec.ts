import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CahierDeTexteService } from './cahier-de-texte.service';

describe('CahierDeTexteService', () => {
  let service: CahierDeTexteService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(CahierDeTexteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
