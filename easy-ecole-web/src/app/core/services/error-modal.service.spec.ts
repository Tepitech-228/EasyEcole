import { ErrorModalEvent, ErrorModalService } from './error-modal.service';

describe('ErrorModalService', () => {
  let service: ErrorModalService;
  let events: ErrorModalEvent[];

  beforeEach(() => {
    service = new ErrorModalService();
    events = [];
    service.modalEvent$.subscribe(event => events.push(event));
  });

  it('uses the success style for successful operations', () => {
    service.showSuccess('Enregistrement effectué.');

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('success');
    expect(events[0].title).toBe('Opération réussie');
  });

  it('keeps warning and error notifications visually distinct', () => {
    service.showWarning('Les données ont changé.', [], 409);

    expect(events[0].type).toBe('warning');
    expect(events[0].title).toBe('Vérification nécessaire');

    service.dismissCurrent();
    service.showError('Le serveur ne répond pas.', [], 500);

    expect(events[1].type).toBe('error');
    expect(events[1].title).toBe('Erreur interne du serveur');
  });

  it('waits for the current popup to close before displaying the next one', () => {
    service.showWarning('Premier message.');
    service.showSuccess('Deuxième message.');

    expect(events.map(event => event.message)).toEqual(['Premier message.']);

    service.dismissCurrent();

    expect(events.map(event => event.message)).toEqual(['Premier message.', 'Deuxième message.']);
  });

  it('replaces a generic mutation success with its specific success message', () => {
    service.showSuccess('Opération effectuée avec succès');
    service.showSuccess('Le dossier a été enregistré.');

    expect(events.length).toBe(2);
    expect(events[1].message).toBe('Le dossier a été enregistré.');
  });
});
