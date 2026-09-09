import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';
import { LocalStorageService } from '../services/local-storage.service';
import * as jwtDecode from 'jwt-decode';

/**
 * Dernière barrière côté frontend : aucune erreur HTTP ne doit disparaître.
 * - journalise l'erreur (console.error avec contexte) ;
 * - notifie l'utilisateur via le ToastService si aucun message local ne l'a fait ;
 * - 401 : vérifie côté client si le JWT est expiré AVANT de supprimer le token ;
 *   si le JWT n'est PAS expiré, on suppose une erreur transitoire (DB, réseau…)
 *   et on NE déconnecte PAS l'utilisateur ;
 * - re-PROPAGE toujours l'erreur pour que les gestionnaires locaux (error:)
 *   puissent réagir de manière spécifique.
 */
@Injectable({ providedIn: 'root' })
export class ErrorInterceptorService implements HttpInterceptor {

  /** Messages lisibles selon le statut HTTP (utilisé si la réponse n'en fournit pas). */
  private static readonly MESSAGES: Record<number, string> = {
    0: 'Serveur injoignable — vérifiez votre connexion',
    400: 'Requête invalide',
    401: 'Session expirée, veuillez vous reconnecter',
    403: "Accès refusé",
    404: 'Ressource non trouvée',
    409: 'Conflit — l\'opération existe déjà ou est incohérente',
    422: 'Données invalides',
    423: 'Compte temporairement bloqué',
    500: 'Erreur interne du serveur',
    502: 'Service indisponible',
    503: 'Service indisponible',
    504: 'Délai dépassé'
  };

  constructor(private toast: ToastService, private router: Router, private localStorageService: LocalStorageService) { }

  /**
   * Vérifie côté client si le JWT stocké est expiré.
   * Retourne true si le token est absent, mal formé ou expiré.
   * Retourne false si le token est encore valide.
   */
  private isTokenExpiredOrInvalid(): boolean {
    const token = this.localStorageService.get(LocalStorageService.AUTH_TOKEN);
    if (!token) return true;

    try {
      const decoded: any = jwtDecode.default(token);
      if (!decoded || !decoded.exp) return true;
      // exp est en secondes ; on ajoute 5 secondes de marge
      const expiryMs = decoded.exp * 1000;
      return Date.now() >= expiryMs;
    } catch {
      // Token mal formé → on considère comme invalide
      return true;
    }
  }

  /**
   * Détecte si le 401 correspond à une session réellement RÉVOQUÉE côté serveur
   * (token obsolète / tokenVersion désynchronisé / signature refusée), et non à
   * une erreur transitoire ou à un simple défaut de jeton côté client.
   *
   * Le backend renvoie ces messages quand le token NE PEUT PLUS JAMAIS être
   * réutilisé sans une nouvelle connexion (tokenVersion désynchronisé après une
   * déconnexion / un changement de mot de passe / un reset) :
   *   - 'Token invalide (session expirée)'  ← tokenVersion désynchronisé / révocation
   *   - messages liés à la signature JWT
   *
   * ⚠️ IMPORTANT : le message 'No access token provided' (54 octets) n'est PAS une
   * révocation serveur : il signifie simplement que le CLIENT n'a pas envoyé de
   * jeton (fréquent à l'initialisation de la page, juste après la connexion OTP,
   * où le dashboard lance ses requêtes avant que le jeton soit recopié). Déconnecter
   * l'utilisateur dans ce cas provoque une BOUCLE de déconnexion — c'est pourtant ce
   * que faisait l'ancienne version (bug « 0 partout » + logout intempestif). On ne
   * force donc la reconnexion que sur une vraie révocation serveur.
   */
  private isSessionRevokedServerSide(backendMessage: string): boolean {
    if (!backendMessage) return false;
    const msg = backendMessage.toLowerCase();
    // Exclure explicitement "no access token" : ce n'est pas une révocation.
    if (msg.includes('no access token')) return false;
    return msg.includes('token invalide')
        || msg.includes('session expirée (token')
        || msg.includes('token expiré')
        || msg.includes('invalid signature')
        || msg.includes('jwt malformed');
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        const backendMessage: string = err?.error?.message || err?.error?.error || '';
        const message = backendMessage || ErrorInterceptorService.MESSAGES[err.status] || `Erreur ${err.status}`;

        console.error(`[HTTP_ERROR] ${req.method} ${req.urlWithParams} → ${err.status}`, {
          code: err?.error?.code,
          message,
          detail: err?.error
        });

        if (err.status === 401) {
          const storedToken = this.localStorageService.get(LocalStorageService.AUTH_TOKEN);
          const hasToken = !!storedToken;
          const tokenExpiredClient = hasToken && this.isTokenExpiredOrInvalid();
          const sessionRevokedServer = this.isSessionRevokedServerSide(backendMessage);

          if (sessionRevokedServer) {
            // Révocation explicite côté serveur (tokenVersion désynchronisé, signature
            // refusée…) : le jeton ne peut plus être réutilisé → reconnexion propre.
            this.toast.error('Session expirée, veuillez vous reconnecter');
            this.localStorageService.remove(LocalStorageService.AUTH_TOKEN);
            if (!this.router.url.startsWith('/auth')) {
              this.router.navigate(['/auth/connexion']);
            }
          } else if (hasToken && tokenExpiredClient) {
            // Un jeton est présent mais expiré côté client → il faut le renouveler.
            this.toast.error('Session expirée, veuillez vous reconnecter');
            this.localStorageService.remove(LocalStorageService.AUTH_TOKEN);
            if (!this.router.url.startsWith('/auth')) {
              this.router.navigate(['/auth/connexion']);
            }
          } else if (!hasToken) {
            // Aucun jeton en local : requête partie SANS token (démarrage de la page,
            // juste après la connexion OTP le dashboard peut tirer ses données avant
            // que le jeton soit recopié). Ce n'est PAS une révocation : on préserve la
            // session et on ne déconnecte pas (sinon boucle de logout intempestive).
            // Si l'utilisateur n'est réellement pas connecté, le garde de route
            // (AuthGuard) l'a déjà redirigé vers la page de connexion.
            console.warn(
              '[HTTP_ERROR] 401 sans token en local (requête partie sans Authorization). ' +
              'Session préservée — aucune déconnexion.',
              { url: req.urlWithParams, backendMessage }
            );
          } else {
            // 401 réellement transitoire (token encore valide + pas de révocation
            // explicite côté serveur) → on préserve la session, pas de redirection.
            console.warn(
              '[HTTP_ERROR] 401 reçu mais session apparemment valide. ' +
              'Erreur probablement transitoire — pas de déconnexion.',
              { url: req.urlWithParams, backendMessage }
            );
            this.toast.error('Erreur temporaire, veuillez réessayer');
          }
        } else if (!req.url.includes('/auth/login')) {
          // Notification par défaut : les composants qui gèrent déjà error: localement
          // afficheront leur propre message ; on évite ici les erreurs critiques muettes.
          // Un 403 (accès refusé) est notifié en ORANGE (warning) puisqu'il s'agit d'un
          // refus d'accès, pas d'une panne : plus visible que le succès vert, moins
          // alarmiste que le rouge (réservé aux vraies erreurs).
          if (err.status === 403) {
            this.toast.warning(message);
          } else {
            this.toast.error(message);
          }
        }

        return throwError(() => err);
      })
    );
  }
}
