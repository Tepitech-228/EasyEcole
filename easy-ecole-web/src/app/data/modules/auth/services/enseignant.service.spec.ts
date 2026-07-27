import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { EnseignantService } from './enseignant.service';

describe('EnseignantService', () => {
  let service: EnseignantService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(EnseignantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
