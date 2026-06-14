import { TestBed } from '@angular/core/testing';

import { MatierePrerequisService } from './matiere-prerequis.service';

describe('MatierePrerequisService', () => {
  let service: MatierePrerequisService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MatierePrerequisService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
