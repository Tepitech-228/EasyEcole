import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription, of, timer } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';

export interface SseNotification {
  id: number;
  type: string;
  titre?: string;
  message: string;
  lien?: string;
  date: string;
  lu: boolean;
}

export interface SseEvent {
  type: 'notification' | 'edt_publie' | 'rappel_salle' | 'connected' | 'keepalive';
  data: any;
}

/** Délai de base de la reconnexion exponentielle (3s, 6s, 12s, 24s puis plafond 30s). */
const RECONNECT_BASE_DELAY_MS = 3000;
/** Plafond du backoff de reconnexion. */
const RECONNECT_MAX_DELAY_MS = 30000;
/** Nombre d'échecs consécutifs avant d'activer le polling de secours. */
const FAILURES_BEFORE_FALLBACK = 3;
/** Intervalle du polling de secours. */
const FALLBACK_POLL_INTERVAL_MS = 30000;
/** Vérification du token courant (login / logout / changement de site). */
const TOKEN_WATCH_INTERVAL_MS = 5000;

/**
 * Flux de notifications temps réel.
 *
 * Source principale : `GET {apiUrl}/events?token=...` (SSE natif, token en query car
 * EventSource n'utilise pas l'HttpInterceptor).
 * Source de secours : polling HTTP, activé uniquement si EventSource est indisponible
 * ou après plusieurs échecs consécutifs, avec déduplication par id.
 */
@Injectable({ providedIn: 'root' })
export class SseService implements OnDestroy {
  private eventSource: EventSource | null = null;
  private notificationSubject = new Subject<SseNotification>();
  private fallbackSub: Subscription | null = null;
  private reconnectSub: Subscription | null = null;
  private tokenWatchSub: Subscription | null = null;
  private consecutiveFailures = 0;
  private connectedToken: string | null = null;
  private destroyed = false;
  private readonly fallbackSeenIds = new Set<number>();

  readonly notifications$ = this.notificationSubject.asObservable();

  constructor(
    private http: HttpClient,
    private zone: NgZone,
    private localStorageService: LocalStorageService
  ) {
    this.connect();
  }

  /**
   * Ouvre (ou relance) le flux SSE avec le token courant.
   * Sans token, on n'ouvre rien : la surveillance du token relancera la connexion après login.
   */
  connect(): void {
    if (this.destroyed) return;
    this.startTokenWatch();
    if (this.eventSource) return;

    this.clearReconnect();

    const token = this.localStorageService.get(LocalStorageService.AUTH_TOKEN);
    this.connectedToken = token;
    if (!token) return;

    // Environnement sans EventSource (navigateur ancien) : polling direct.
    if (typeof EventSource === 'undefined') {
      this.startFallback();
      return;
    }

    const url = `${environment.apiUrl}/events?token=${encodeURIComponent(token)}`;
    let source: EventSource;
    try {
      source = new EventSource(url);
    } catch {
      // Construction refusée (URL/token invalide) : on passe par le backoff puis le fallback.
      this.onStreamFailure();
      return;
    }

    this.eventSource = source;

    source.onerror = () => this.onStreamFailure();

    // Événements métier du backend.
    source.addEventListener('notification', (event: Event) => this.handleNotificationEvent(event));
    // `connected` = authentification acceptée par le serveur : flux considéré sain.
    source.addEventListener('connected', () => this.handleStreamHealthy());
    // `keepalive` est du bruit de maintien de connexion : ignoré volontairement.
    source.addEventListener('keepalive', () => { });
  }

  /**
   * Force une reconnexion complète (utile après un changement de token / de site).
   * Conserve l'API publique existante.
   */
  reconnect(): void {
    if (this.destroyed) return;
    this.disconnect();
    this.consecutiveFailures = 0;
    this.connect();
  }

  disconnect(): void {
    this.closeEventSource();
    this.clearReconnect();
    this.stopFallback();
    this.stopTokenWatch();
    this.connectedToken = null;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.disconnect();
    this.notificationSubject.complete();
  }

  // ---------------------------------------------------------------------------
  // SSE
  // ---------------------------------------------------------------------------

  private handleNotificationEvent(event: Event): void {
    // Le flux peut avoir été ouvert avec un token devenu obsolète (logout / autre compte).
    if (this.connectedToken === null || this.connectedToken !== this.currentToken()) {
      this.checkToken();
      return;
    }

    const messageEvent = event as MessageEvent;
    if (typeof messageEvent.data !== 'string') return;

    const notif = this.parseEventData(messageEvent.data);
    if (!notif) return;

    this.handleStreamHealthy();
    this.zone.run(() => this.notificationSubject.next(notif));
  }

  /** Flux prouvé sain : on remet le compteur d'échecs à zéro et on coupe le secours. */
  private handleStreamHealthy(): void {
    this.consecutiveFailures = 0;
    this.stopFallback();
  }

  /** Erreur (ou fermeture) du flux : EventSource est neutralisé pour piloter le backoff nous-mêmes. */
  private onStreamFailure(): void {
    this.closeEventSource();
    if (this.destroyed) return;

    this.consecutiveFailures++;
    if (this.consecutiveFailures >= FAILURES_BEFORE_FALLBACK) {
      this.startFallback();
    }
    this.scheduleReconnect();
  }

  private closeEventSource(): void {
    if (!this.eventSource) return;
    this.eventSource.onerror = null;
    this.eventSource.close();
    this.eventSource = null;
  }

  private scheduleReconnect(): void {
    if (this.destroyed || this.reconnectSub) return;

    const attempt = Math.max(0, this.consecutiveFailures - 1);
    const delay = Math.min(RECONNECT_MAX_DELAY_MS, RECONNECT_BASE_DELAY_MS * Math.pow(2, attempt));

    this.reconnectSub = timer(delay).subscribe(() => {
      this.reconnectSub = null;
      this.connect();
    });
  }

  private clearReconnect(): void {
    if (this.reconnectSub) {
      this.reconnectSub.unsubscribe();
      this.reconnectSub = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Surveillance du token (le service est un singleton racine, pas lié au layout)
  // ---------------------------------------------------------------------------

  private startTokenWatch(): void {
    if (this.destroyed || this.tokenWatchSub) return;
    this.tokenWatchSub = timer(0, TOKEN_WATCH_INTERVAL_MS).subscribe(() => this.checkToken());
  }

  private stopTokenWatch(): void {
    if (this.tokenWatchSub) {
      this.tokenWatchSub.unsubscribe();
      this.tokenWatchSub = null;
    }
  }

  /**
   * Coupe immédiatement un flux appartenant à un autre token (logout, autre compte)
   * et rebranche dès qu'un token valide apparaît.
   */
  private checkToken(): void {
    if (this.destroyed) return;

    const token = this.currentToken();
    if (token === this.connectedToken) return;

    this.closeEventSource();
    this.stopFallback();
    this.clearReconnect();
    this.consecutiveFailures = 0;
    this.connect();
  }

  private currentToken(): string | null {
    return this.localStorageService.get(LocalStorageService.AUTH_TOKEN);
  }

  // ---------------------------------------------------------------------------
  // Polling de secours
  // ---------------------------------------------------------------------------

  private startFallback(): void {
    if (this.destroyed || this.fallbackSub) return;
    if (!this.connectedToken || this.connectedToken !== this.currentToken()) return;

    this.fallbackSub = timer(0, FALLBACK_POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => {
          // Session terminée ou token changé : on arrête le secours au lieu d'empiler des 401.
          const token = this.currentToken();
          if (!token || token !== this.connectedToken) {
            this.stopFallback();
            return of([] as SseNotification[]);
          }
          return this.http
            .get<SseNotification[]>(`${environment.API_MODULES.ELEARNING}/notifications`)
            .pipe(catchError(() => of([] as SseNotification[])));
        })
      )
      .subscribe((notifs: SseNotification[]) => this.emitFallbackNotifications(notifs));
  }

  private stopFallback(): void {
    if (this.fallbackSub) {
      this.fallbackSub.unsubscribe();
      this.fallbackSub = null;
    }
  }

  /** N'émet que les notifications jamais vues par le secours, et seulement les non lues. */
  private emitFallbackNotifications(notifs: SseNotification[]): void {
    if (!Array.isArray(notifs) || !notifs.length) return;

    const fresh: SseNotification[] = [];
    for (const raw of notifs) {
      const notif = this.parseNotification(raw);
      if (!notif || this.fallbackSeenIds.has(notif.id)) continue;
      this.fallbackSeenIds.add(notif.id);
      if (!notif.lu) fresh.push(notif);
    }

    if (!fresh.length) return;
    this.zone.run(() => {
      for (const notif of fresh) {
        this.notificationSubject.next(notif);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Parsing défensif (payload non fiable)
  // ---------------------------------------------------------------------------

  private parseEventData(data: string): SseNotification | null {
    try {
      return this.parseNotification(JSON.parse(data));
    } catch {
      return null;
    }
  }

  private parseNotification(raw: unknown): SseNotification | null {
    if (!raw || typeof raw !== 'object') return null;

    const data = raw as { [key: string]: unknown };
    const id = Number(data['id']);
    if (!Number.isFinite(id)) return null;

    return {
      id,
      type: typeof data['type'] === 'string' ? data['type'] : 'notification',
      titre: typeof data['titre'] === 'string' ? data['titre'] : undefined,
      message: typeof data['message'] === 'string' ? data['message'] : '',
      lien: typeof data['lien'] === 'string' ? data['lien'] : undefined,
      date: typeof data['date'] === 'string' ? data['date'] : new Date().toISOString(),
      lu: data['lu'] === true,
    };
  }
}
