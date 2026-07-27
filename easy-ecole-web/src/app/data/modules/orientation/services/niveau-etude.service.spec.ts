import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { NiveauEtudeService } from './niveau-etude.service';

describe('NiveauEtudeService', () => {
  let service: NiveauEtudeService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(NiveauEtudeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
