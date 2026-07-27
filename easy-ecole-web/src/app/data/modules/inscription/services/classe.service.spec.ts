import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ClasseService } from './classe.service';

describe('ClasseService', () => {
  let service: ClasseService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ClasseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
