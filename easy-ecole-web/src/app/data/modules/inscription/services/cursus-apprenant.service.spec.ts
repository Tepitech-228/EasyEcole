import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CursusApprenantService } from './cursus-apprenant.service';

describe('CursusApprenantService', () => {
  let service: CursusApprenantService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(CursusApprenantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
