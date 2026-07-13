import { TestBed } from '@angular/core/testing';

import { ReponseOrientationService } from './reponse-orientation.service';

describe('ReponseOrientationService', () => {
  let service: ReponseOrientationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReponseOrientationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
