import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ChapitreCoursService } from './chapitre-cours.service';

describe('ChapitreCoursService', () => {
  let service: ChapitreCoursService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ChapitreCoursService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
