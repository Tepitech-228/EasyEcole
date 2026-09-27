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
  type: 'error' | 'warning' | 'info';
}

/**
 * Service de gestion d'erreurs via modaux Bootstrap centrés.
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

  /** File d'attente pour les erreurs simultanées */
  private queue: ErrorModalEvent[] = [];
  /** Indicateur si un modal est actuellement affiché */
  private isProcessing: boolean = false;

  constructor() { }

  // ========================
  // MÉTHODES PUBLIQUES
  // ========================

  /**
   * Affiche un modal d'erreur simple.
   * Utilise la variante "centered" (modal-dialog modal-dialog-centered).
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
   * Affiche un modal scrollable pour une erreur serveur (500+).
   * Utilise la variante "scrollable" avec stack trace si disponible.
   *
   * @param error Objet d'erreur HTTP
   * @param message Message optionnel
   */
  showServerError(error: any, message?: string): void {
    const statusCode = error?.status || 500;
    const errorDetails: string[] = [];

    // Extrait les détails de l'erreur si disponibles
    if (error?.error?.message) {
      errorDetails.push(error.error.message);
    }
    if (error?.error?.stack) {
      errorDetails.push(error.error.stack);
    }
    if (error?.message && !errorDetails.includes(error.message)) {
      errorDetails.push(error.message);
    }

    const event: ErrorModalEvent = {
      title: 'Erreur serveur',
      message: message || 'Une erreur interne s\'est produite. Veuillez réessayer.',
      details: errorDetails.length > 0 ? errorDetails : [`Code: ${statusCode}`],
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
    this.queue.push(event);

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Traite la file d'attente séquentiellement.
   * Un modal à la fois pour éviter les conflits visuels.
   */
  private processQueue(): void {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const event = this.queue.shift()!;

    // Émet l'événement au composant modal
    this.modalEventSubject.next(event);

    // Simule un délai avant de traiter la prochaine erreur
    // Le modal se ferme quand l'utilisateur clique sur "Fermer"
    // La prochaine erreur sera traitée après fermeture
    // Pour éviter la pile infinie, on utilise un timer court
    setTimeout(() => {
      this.processQueue();
    }, 500);
  }

  // ========================
  // UTILITAIRES
  // ========================

  /**
   * Retourne le titre approprié selon le code HTTP et le type.
   */
  private getTitle(statusCode: number, type: string): string {
    const titles: Record<number, Record<string, string>> = {
      400: { error: 'Requête invalide', warning: 'Données incorrectes', info: 'Information' },
      401: { error: 'Session expirée', warning: 'Session expirée', info: 'Session' },
      403: { error: 'Accès refusé', warning: 'Accès refusé', info: 'Accès' },
      404: { error: 'Ressource non trouvée', warning: 'Ressource introuvable', info: 'Information' },
      422: { error: 'Données invalides', warning: 'Erreurs de validation', info: 'Validation' },
      500: { error: 'Erreur interne du serveur', warning: 'Erreur serveur', info: 'Serveur' },
      502: { error: 'Service indisponible', warning: 'Service temporairement indisponible', info: 'Service' },
      503: { error: 'Service indisponible', warning: 'Service temporairement indisponible', info: 'Service' }
    };

    return titles[statusCode]?.[type] || `Erreur ${statusCode}`;
  }
}
