import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

/**
 * Représente un événement d'erreur affiché dans le modal global.
 */
export interface ErrorModalEvent {
  /** Titre du modal (ex: "Erreur serveur") */
  title: string;
  /** Message principal à afficher */
  message: string;
  /** Liste des détails (ex: erreurs de validation, lignes d'import Excel) */
  details: string[];
  /** Code HTTP du statut */
  statusCode: number;
  /** Type visuel du modal */
  type: 'success' | 'error' | 'warning' | 'info';
}

/**
 * Service global de messages de réussite, d'avertissement et d'erreur.
 *
 * Fonctionnalités :
 * - Affichage de modaux centrés pour erreurs simples (400, 403, 404, 401)
 * - Affichage de modaux scrollables pour erreurs détaillées (500, validation, imports)
 * - File d'attente pour les erreurs simultanées
 * - Événement de reconnexion pour le code 401
 * - Observable pour le composant ErrorModalComponent
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorModalService {

  /** Sujet interne pour les événements de modal */
  private modalEventSubject = new Subject<ErrorModalEvent>();
  /** Observable publique pour le composant modal */
  modalEvent$: Observable<ErrorModalEvent> = this.modalEventSubject.asObservable();

  /** Sujet pour l'événement de reconnexion (401) */
  private reconnectSubject = new Subject<void>();
  /** Observable publique pour déclencher la reconnexion */
  reconnect$ = this.reconnectSubject.asObservable();

  /** File d'attente pour les notifications simultanées */
  private queue: ErrorModalEvent[] = [];
  private activeEvent: ErrorModalEvent | null = null;

  constructor() { }

  // ========================
  // MÉTHODES PUBLIQUES
  // ========================

  /**
   * Affiche un message global avec son niveau de gravité.
   *
   * @param message Message à afficher
   * @param details Liste optionnelle de détails
   * @param statusCode Code HTTP (défaut: 500)
   * @param type Type visuel (défaut: 'error')
   */
  showError(message: string, details?: string[], statusCode: number = 500, type: 'error' | 'warning' | 'info' = 'error'): void {
    const event: ErrorModalEvent = {
      title: this.getTitle(statusCode, type),
      message,
      details: details || [],
      statusCode,
      type
    };
    this.enqueue(event);
  }

  showSuccess(message: string, details: string[] = []): void {
    this.enqueue({
      title: 'Opération réussie',
      message,
      details,
      statusCode: 200,
      type: 'success'
    });
  }

  showWarning(message: string, details: string[] = [], statusCode: number = 409): void {
    this.enqueue({
      title: this.getTitle(statusCode, 'warning'),
      message,
      details,
      statusCode,
      type: 'warning'
    });
  }

  showInfo(message: string, details: string[] = []): void {
    this.enqueue({
      title: 'Information',
      message,
      details,
      statusCode: 0,
      type: 'info'
    });
  }

  /**
   * Affiche un modal scrollable avec une liste d'erreurs de validation.
   * Utilise la variante "scrollable" (modal-dialog modal-dialog-centered modal-dialog-scrollable).
   *
   * @param errors Liste des messages d'erreur de validation
   * @param message Message principal (défaut: "Données invalides")
   */
  showValidationErrors(errors: string[], message: string = 'Données invalides'): void {
    const event: ErrorModalEvent = {
      title: 'Erreurs de validation',
      message,
      details: errors,
      statusCode: 422,
      type: 'warning'
    };
    this.enqueue(event);
  }

  /**
   * Affiche une erreur serveur sans exposer de détails techniques internes.
   *
   * @param error Objet d'erreur HTTP
   * @param message Message compréhensible destiné à l'utilisateur
   */
  showServerError(error: any, message?: string): void {
    const statusCode = error?.status || 500;

    const event: ErrorModalEvent = {
      title: 'Erreur serveur',
      message: message || 'Une erreur technique empêche de terminer cette opération.',
      details: [`Code de référence : ${statusCode}`],
      statusCode,
      type: 'error'
    };
    this.enqueue(event);
  }

  /**
   * Affiche un modal d'erreur 401 avec bouton "Se reconnecter".
   * Utilise la variante "centered" simple.
   *
   * @param message Message de session expirée
   */
  showUnauthorized(message: string = 'Session expirée, veuillez vous reconnecter'): void {
    const event: ErrorModalEvent = {
      title: 'Session expirée',
      message,
      details: [],
      statusCode: 401,
      type: 'warning'
    };
    this.enqueue(event);
  }

  /**
   * Déclenche l'événement de reconnexion pour le code 401.
   */
  triggerReconnect(): void {
    this.reconnectSubject.next();
  }

  // ========================
  // GESTION DE LA FILE D'ATTENTE
  // ========================

  /**
   * Ajoute un événement à la file d'attente et le traite si possible.
   * Si un modal est déjà affiché, l'erreur est mise en attente.
   */
  private enqueue(event: ErrorModalEvent): void {
    const pending = [this.activeEvent, ...this.queue].filter((item): item is ErrorModalEvent => !!item);
    if (pending.some(item => item.message === event.message)) {
      return;
    }

    const genericSuccessMessage = 'Opération effectuée avec succès';
    const queuedGenericSuccess = this.queue.findIndex(item =>
      item.type === 'success' && item.message === genericSuccessMessage
    );
    if (event.type === 'success' && event.message !== genericSuccessMessage) {
      if (this.activeEvent?.type === 'success' && this.activeEvent.message === genericSuccessMessage) {
        this.activeEvent = event;
        this.modalEventSubject.next(event);
        return;
      }
      if (queuedGenericSuccess !== -1) {
        this.queue.splice(queuedGenericSuccess, 1, event);
        return;
      }
    }

    this.queue.push(event);
    this.presentNext();
  }

  dismissCurrent(): void {
    this.activeEvent = null;
    this.presentNext();
  }

  private presentNext(): void {
    if (this.activeEvent || this.queue.length === 0) return;
    this.activeEvent = this.queue.shift() || null;
    if (this.activeEvent) {
      this.modalEventSubject.next(this.activeEvent);
    }
  }

  // ========================
  // UTILITAIRES
  // ========================

  /**
   * Retourne le titre approprié selon le code HTTP et le type.
   */
  private getTitle(statusCode: number, type: string): string {
    const titles: Record<number, Record<string, string>> = {
      0: { error: 'Connexion impossible', warning: 'Vérifiez votre connexion', info: 'Information' },
      200: { success: 'Opération réussie', warning: 'Information', error: 'Erreur', info: 'Information' },
      400: { error: 'Action impossible', warning: 'Vérification nécessaire', info: 'Information' },
      401: { error: 'Session expirée', warning: 'Session expirée', info: 'Session' },
      403: { error: 'Accès refusé', warning: 'Accès refusé', info: 'Accès' },
      404: { error: 'Élément introuvable', warning: 'Élément introuvable', info: 'Information' },
      409: { error: 'Conflit de données', warning: 'Vérification nécessaire', info: 'Information' },
      422: { error: 'Données invalides', warning: 'Erreurs de validation', info: 'Validation' },
      500: { error: 'Erreur interne du serveur', warning: 'Erreur serveur', info: 'Serveur' },
      502: { error: 'Service indisponible', warning: 'Service temporairement indisponible', info: 'Service' },
      503: { error: 'Service indisponible', warning: 'Service temporairement indisponible', info: 'Service' },
      504: { error: 'Délai dépassé', warning: 'Réponse trop longue', info: 'Service' }
    };

    return titles[statusCode]?.[type] || `Erreur ${statusCode}`;
  }
}
