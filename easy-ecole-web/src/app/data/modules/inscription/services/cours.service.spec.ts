import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CoursService } from './cours.service';

describe('CoursService', () => {
  let service: CoursService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(CoursService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
