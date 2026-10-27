import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Observable, of, Subject, throwError } from 'rxjs';
import { PointageService } from 'src/app/data/modules/inscription/services/pointage.service';
import { AuthService } from 'src/app/data/modules/auth/services/auth.service';
import { SocketService, TerminalAttendanceEvent } from 'src/app/core/services/socket.service';
import { TerminalPointagePageComponent } from './terminal-pointage-page.component';

describe('TerminalPointagePageComponent', () => {
  let fixture: ComponentFixture<TerminalPointagePageComponent>;
  let pointageService: jasmine.SpyObj<PointageService>;
  let socketService: jasmine.SpyObj<SocketService>;
  let terminalAttendanceEvents: Subject<TerminalAttendanceEvent>;

  const dispatchKey = (key: string, target?: EventTarget): void => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true });
    (target ?? document).dispatchEvent(event);
  };

  const typeFast = (text: string, target?: EventTarget): void => {
    for (let i = 0; i < text.length; i++) {
      dispatchKey(text.charAt(i), target);
    }
  };

  const dispatchAltGraphKey = (key: string): void => {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      ctrlKey: true,
      altKey: true
    });
    Object.defineProperty(event, 'getModifierState', {
      value: (modifier: string) => modifier === 'AltGraph'
    });
    document.dispatchEvent(event);
  };

  beforeEach(async () => {
    terminalAttendanceEvents = new Subject<TerminalAttendanceEvent>();
    pointageService = jasmine.createSpyObj<PointageService>(
      'PointageService',
      [
        'getToday',
        'verifierStatutByQR',
        'pointerParQR',
        'getTerminauxHikvision',
        'creerTerminalHikvision',
        'testerTerminalHikvision',
        'modifierEtatTerminalHikvision'
      ]
    );
    pointageService.getToday.and.returnValue(throwError(() => new Error('network unavailable')));
    pointageService.getTerminauxHikvision.and.returnValue(of([]));
    socketService = jasmine.createSpyObj<SocketService>('SocketService', ['connect', 'onTerminalAttendance']);
    socketService.onTerminalAttendance.and.returnValue(terminalAttendanceEvents.asObservable());
    pointageService.verifierStatutByQR.and.returnValue(of({ statut: 'vert', utilisateurId: 'u1', nom: 'Test' }));
    pointageService.pointerParQR.and.returnValue(of({
      success: true,
      mode: 'arrivee',
      pointage: { heureArrivee: '08:00:00', heureDepart: null } as any
    }));

    await TestBed.configureTestingModule({
      declarations: [TerminalPointagePageComponent],
      providers: [
        { provide: PointageService, useValue: pointageService },
        { provide: SocketService, useValue: socketService },
        { provide: AuthService, useValue: { getSitesMoi: () => of([]) } }
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TerminalPointagePageComponent);
  });

  it('shows an actionable error instead of claiming there was no pointage', () => {
    fixture.detectChanges();

    expect(fixture.componentInstance.loading).toBeFalse();
    expect(fixture.componentInstance.loadError).toContain('Impossible de récupérer');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.pointage-self-empty')).toBeNull();
  });

  it('announces a saved Hikvision attendance event received over Socket.IO', () => {
    pointageService.getToday.and.returnValue(of(null));
    fixture.componentInstance.loading = false;
    fixture.componentInstance.loadError = '';
    fixture.detectChanges();
    terminalAttendanceEvents.next({
      utilisateurId: 12,
      nom: 'Doe',
      prenoms: 'Jane',
      role: 'apprenant',
      employeeNoString: 'ESA001',
      date: '2026-10-18',
      time: '09:18:22',
      mode: 'arrivee',
      etablissementId: 1,
      photo: 'jane-doe.jpg',
      photoType: 'apprenant'
    });

    expect(fixture.componentInstance.lastAttendanceName).toBe('Jane Doe');
    expect(fixture.componentInstance.lastAttendanceRole).toBe('Étudiant autorisé');
    expect(fixture.componentInstance.lastAttendancePhotoUrl).toContain('/media/photos/apprenants/jane-doe.jpg');
    expect(fixture.componentInstance.scanSuccess).toBe('Arrivée enregistrée à 09:18:22');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pointage-state-card--success img')?.getAttribute('src'))
      .toContain('/media/photos/apprenants/jane-doe.jpg');
  });

  it('shows Hikvision as the only facial terminal on the attendance page', () => {
    fixture.detectChanges();

    const pageText = fixture.nativeElement.textContent;
    expect(pageText).toContain('Hikvision MinMoe');
    expect(pageText).not.toContain('ZKTeco');
  });

  it('retries the failed request and clears the previous error', () => {
    pointageService.getToday.and.returnValues(
      throwError(() => new Error('network unavailable')),
      throwError(() => new Error('network unavailable')),
      of(null)
    );
    fixture.detectChanges();
    fixture.componentInstance.retryLoadTodayPointage();

    expect(pointageService.getToday).toHaveBeenCalledTimes(3);
    expect(fixture.componentInstance.loadError).toBe('');
    expect(fixture.componentInstance.loading).toBeFalse();
  });

  // E1/E2(a)/E3 — frappe rapide du lecteur clôturée par Enter
  it('validates a fast reader scan ending with Enter and calls the status service', () => {
    fixture.detectChanges();
    const code = 'CARTE|v=1|abc123';

    typeFast(code);
    dispatchKey('Enter');

    expect(pointageService.verifierStatutByQR).toHaveBeenCalledWith(code);
    expect(pointageService.pointerParQR).toHaveBeenCalledWith(code);
  });

  it('preserves QR separators typed through AltGr on an AZERTY keyboard', () => {
    fixture.detectChanges();
    const code = 'CARTE|v=1|payload0123456789abcdef';

    typeFast('CARTE');
    dispatchAltGraphKey('|');
    typeFast('v=1');
    dispatchAltGraphKey('|');
    typeFast('payload0123456789abcdef');
    dispatchKey('Enter');

    expect(pointageService.verifierStatutByQR).toHaveBeenCalledWith(code);
    expect(pointageService.pointerParQR).toHaveBeenCalledWith(code);
  });

  // E2(b) — fin de scan par interruption (~400 ms) sans Enter
  it('validates a fast reader scan after the inactivity flush delay', () => {
    jasmine.clock().install();
    try {
      jasmine.clock().mockDate(new Date(2026, 0, 1));
      fixture.detectChanges();
      const code = 'MAT-2024-001';

      typeFast(code);
      expect(pointageService.verifierStatutByQR).not.toHaveBeenCalled();

      jasmine.clock().tick(TerminalPointagePageComponent.TOVI_FLUSH_MS);
      expect(pointageService.verifierStatutByQR).toHaveBeenCalledWith(code);
      expect(pointageService.pointerParQR).toHaveBeenCalledWith(code);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  // E2/robustesse — une frappe humaine lente ne doit jamais déclencher de scan
  it('ignores a slow human cadence (gap > 150 ms)', () => {
    jasmine.clock().install();
    try {
      jasmine.clock().mockDate(new Date(2026, 0, 1));
      fixture.detectChanges();

      const keys = 'UTIL01';
      for (let i = 0; i < keys.length; i++) {
        dispatchKey(keys.charAt(i));
        jasmine.clock().tick(TerminalPointagePageComponent.TOVI_CHAR_MAX_GAP_MS + 50);
      }
      dispatchKey('Enter');

      expect(pointageService.verifierStatutByQR).not.toHaveBeenCalled();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  // E4 — la saisie dans un champ de formulaire n'est pas capturée
  it('ignores keydown events coming from a form field', () => {
    fixture.detectChanges();
    const input = document.createElement('input');
    document.body.appendChild(input);
    try {
      typeFast('CARTE|v=1|abc123', input);
      dispatchKey('Enter', input);

      expect(pointageService.verifierStatutByQR).not.toHaveBeenCalled();
    } finally {
      document.body.removeChild(input);
    }
  });

  // E5 — le buffer est vidé après chaque validation
  it('clears the reader buffer after a validation', () => {
    fixture.detectChanges();
    const component = fixture.componentInstance as any;

    typeFast('CARTE|v=1|abc123');
    dispatchKey('Enter');

    expect(component.toviBuffer).toBe('');
  });

  it('does not record when the server rejects the scanned identity', () => {
    pointageService.verifierStatutByQR.and.returnValue(of({
      statut: 'rouge',
      utilisateurId: 'u1',
      message: 'Dossier suspendu'
    }));
    fixture.detectChanges();

    typeFast('CARTE|v=1|blocked');
    dispatchKey('Enter');

    expect(pointageService.pointerParQR).not.toHaveBeenCalled();
    expect(fixture.componentInstance.scannedUser.statut).toBe('rouge');
  });

  it('ignores a repeated HID scan during the duplicate window', () => {
    fixture.detectChanges();
    const code = 'CARTE|v=1|duplicate';

    typeFast(code);
    dispatchKey('Enter');
    typeFast(code);
    dispatchKey('Enter');

    expect(pointageService.verifierStatutByQR).toHaveBeenCalledTimes(1);
    expect(pointageService.pointerParQR).toHaveBeenCalledTimes(1);
  });

  it('queues distinct successive HID scans and lets the server determine the mode', () => {
    fixture.detectChanges();
    fixture.componentInstance.scanMode = 'depart';

    typeFast('CARTE|v=1|first');
    dispatchKey('Enter');
    typeFast('CARTE|v=1|second');
    dispatchKey('Enter');

    expect(pointageService.verifierStatutByQR).toHaveBeenCalledTimes(2);
    expect(pointageService.pointerParQR).toHaveBeenCalledWith('CARTE|v=1|first');
    expect(pointageService.pointerParQR).toHaveBeenCalledWith('CARTE|v=1|second');
  });

  it('serializes scans received while the first server validation is still pending', () => {
    const pendingValidation = new Subject<any>();
    pointageService.verifierStatutByQR.and.returnValues(
      pendingValidation,
      of({ statut: 'vert', utilisateurId: 'u2', nom: 'Deuxième' })
    );
    fixture.detectChanges();

    typeFast('CARTE|v=1|first-pending');
    dispatchKey('Enter');
    typeFast('CARTE|v=1|second-queued');
    dispatchKey('Enter');

    expect(pointageService.verifierStatutByQR).toHaveBeenCalledTimes(1);
    pendingValidation.next({ statut: 'vert', utilisateurId: 'u1', nom: 'Premier' });
    pendingValidation.complete();

    expect(pointageService.verifierStatutByQR).toHaveBeenCalledTimes(2);
    expect(pointageService.pointerParQR).toHaveBeenCalledWith('CARTE|v=1|first-pending');
    expect(pointageService.pointerParQR).toHaveBeenCalledWith('CARTE|v=1|second-queued');
  });

  it('continues processing later scans after an earlier scan fails', () => {
    pointageService.verifierStatutByQR.and.returnValues(
      throwError(() => new Error('network unavailable')),
      of({ statut: 'vert', utilisateurId: 'u2', nom: 'Deuxième' })
    );
    fixture.detectChanges();

    typeFast('CARTE|v=1|network-error');
    dispatchKey('Enter');
    typeFast('CARTE|v=1|network-recovered');
    dispatchKey('Enter');

    expect(pointageService.verifierStatutByQR).toHaveBeenCalledTimes(2);
    expect(pointageService.pointerParQR).toHaveBeenCalledTimes(1);
    expect(pointageService.pointerParQR).toHaveBeenCalledWith('CARTE|v=1|network-recovered');
  });

  it('announces a staff arrival with the name and hour after a QR pointage succeeds', () => {
    pointageService.verifierStatutByQR.and.returnValue(of({ statut: 'vert', utilisateurId: 'u1', nom: 'Test', prenoms: 'Paul', role: 'enseignant' }));
    const speak = spyOn(window.speechSynthesis, 'speak');
    fixture.detectChanges();

    typeFast('CARTE|v=1|voice-success');
    dispatchKey('Enter');

    expect(pointageService.pointerParQR).toHaveBeenCalled();
    expect(speak).toHaveBeenCalledTimes(1);
    const utterance = speak.calls.mostRecent().args[0] as SpeechSynthesisUtterance;
    expect(utterance.lang).toBe('fr-FR');
    expect(utterance.text).toContain('Bonjour');
    expect(utterance.text).toContain('Bonne arrivée');
    expect(utterance.text).toContain('08:00');
  });

  it('uses the server-selected departure mode for the announcement', () => {
    pointageService.verifierStatutByQR.and.returnValue(of({ statut: 'vert', utilisateurId: 'u1', nom: 'Test', prenoms: 'Paul', role: 'enseignant' }));
    pointageService.pointerParQR.and.returnValue(of({
      success: true,
      mode: 'depart',
      pointage: { heureArrivee: '08:00:00', heureDepart: '17:00:00' } as any
    }));
    const speak = spyOn(window.speechSynthesis, 'speak');
    fixture.detectChanges();

    typeFast('CARTE|v=1|voice-departure');
    dispatchKey('Enter');

    expect(speak).toHaveBeenCalledTimes(1);
    const utterance = speak.calls.mostRecent().args[0] as SpeechSynthesisUtterance;
    expect(utterance.text).toContain('Au revoir');
    expect(utterance.text).toContain('Départ');
    expect(utterance.text).toContain('17:00');
    expect(fixture.componentInstance.scanSuccess).toContain('17:00:00');
  });

  it('announces a recorded student passage with the hour on a QR scan', () => {
    pointageService.verifierStatutByQR.and.returnValue(of({ statut: 'vert', utilisateurId: 'u1', nom: 'Test', prenoms: 'Ada', role: 'apprenant' }));
    pointageService.pointerParQR.and.returnValue(of({
      success: true,
      mode: 'passage',
      pointage: { heureArrivee: '10:30:00', heureDepart: null } as any
    }));
    const speak = spyOn(window.speechSynthesis, 'speak');
    fixture.detectChanges();

    typeFast('CARTE|v=1|voice-passage');
    dispatchKey('Enter');

    expect(speak).toHaveBeenCalledTimes(1);
    const utterance = speak.calls.mostRecent().args[0] as SpeechSynthesisUtterance;
    expect(utterance.text).toContain('Ada');
    expect(utterance.text).toContain('Passage enregistré');
    expect(utterance.text).toContain('10:30');
  });

  it('announces the refusal when the scanned identity is not up to date', () => {
    pointageService.verifierStatutByQR.and.returnValue(of({
      statut: 'rouge',
      utilisateurId: 'u1',
      nom: 'Test',
      prenoms: 'Ada',
      role: 'apprenant'
    }));
    const speak = spyOn(window.speechSynthesis, 'speak');
    fixture.detectChanges();

    typeFast('CARTE|v=1|voice-refused');
    dispatchKey('Enter');

    expect(pointageService.pointerParQR).not.toHaveBeenCalled();
    expect(speak).toHaveBeenCalledTimes(1);
    const utterance = speak.calls.mostRecent().args[0] as SpeechSynthesisUtterance;
    expect(utterance.text).toContain('Accès refusé');
  });

  it('announces the refusal for a Hikvision refuse event', () => {
    const speak = spyOn(window.speechSynthesis, 'speak');
    fixture.detectChanges();

    terminalAttendanceEvents.next({
      utilisateurId: 12,
      nom: 'Doe',
      prenoms: 'Jane',
      role: 'apprenant',
      employeeNoString: 'ESA001',
      date: '2026-10-18',
      time: '09:18:22',
      mode: 'refuse',
      etablissementId: 1,
      motifRefus: 'Dossier non à jour'
    });

    expect(speak).toHaveBeenCalledTimes(1);
    const utterance = speak.calls.mostRecent().args[0] as SpeechSynthesisUtterance;
    expect(utterance.text).toContain('Accès refusé');
    expect(fixture.componentInstance.scanError).toContain('Dossier non à jour');
  });

  it('does not announce a QR scan when the server did not record the attendance', () => {
    const failure = { error: { message: 'Pointage déjà effectué' } };
    pointageService.pointerParQR.and.callFake(() => new Observable<never>((subscriber) => {
      subscriber.error(failure);
    }));
    const speak = spyOn(window.speechSynthesis, 'speak');
    fixture.detectChanges();

    typeFast('CARTE|v=1|voice-rejected');
    dispatchKey('Enter');

    expect(speak).not.toHaveBeenCalled();
    expect(fixture.componentInstance.scanError).toBe('Pointage déjà effectué');
  });

  it('shows a duplicate QR attendance as a yellow warning instead of an error', () => {
    pointageService.getToday.and.returnValue(of(null));
    fixture.componentInstance.loading = false;
    fixture.componentInstance.loadError = '';
    pointageService.pointerParQR.and.callFake(() => new Observable<never>((subscriber) => {
      subscriber.error({
        error: {
          alreadyExists: true,
          code: 'ALREADY_EXISTS',
          message: 'Départ déjà pointé aujourd’hui'
        }
      });
    }));
    fixture.detectChanges();

    typeFast('CARTE|v=1|duplicate-attendance');
    dispatchKey('Enter');
    fixture.detectChanges();

    expect(fixture.componentInstance.scanWarning).toBe('Départ déjà pointé aujourd’hui');
    expect(fixture.componentInstance.scanError).toBe('');
    expect(fixture.nativeElement.querySelector('.pointage-state-card--warning')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.pointage-state-card--error')).toBeNull();
  });

  it('provides a voice test action so the browser can initialize speech playback', () => {
    const speak = spyOn(window.speechSynthesis, 'speak');
    fixture.detectChanges();

    fixture.componentInstance.testVoiceAnnouncement();

    expect(speak).toHaveBeenCalledTimes(1);
    expect((speak.calls.mostRecent().args[0] as SpeechSynthesisUtterance).text).toBe('ESA, le label des diplômes de qualité');
  });
});
