import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CategorieService } from './categorie.service';

describe('CategorieService', () => {
  let service: CategorieService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(CategorieService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
