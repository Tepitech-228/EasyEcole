import { TestBed } from '@angular/core/testing';

import { PresenceCoursParticipantService } from './presence-cours-participant.service';

describe('PresenceCoursParticipantService', () => {
  let service: PresenceCoursParticipantService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PresenceCoursParticipantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
