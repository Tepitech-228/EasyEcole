import { TestBed } from '@angular/core/testing';

import { AnneeAcademiqueService } from './annee-academique.service';

describe('AnneeAcademiqueService', () => {
  let service: AnneeAcademiqueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnneeAcademiqueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
