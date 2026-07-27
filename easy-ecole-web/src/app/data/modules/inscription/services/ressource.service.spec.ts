import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { RessourceService } from './ressource.service';

describe('RessourceService', () => {
  let service: RessourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(RessourceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
