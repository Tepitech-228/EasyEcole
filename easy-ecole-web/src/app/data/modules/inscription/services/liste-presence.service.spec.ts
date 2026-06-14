import { TestBed } from '@angular/core/testing';

import { ListePresenceService } from './liste-presence.service';

describe('ListePresenceService', () => {
  let service: ListePresenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ListePresenceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
