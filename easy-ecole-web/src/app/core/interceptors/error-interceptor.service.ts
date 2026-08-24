import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';
import { LocalStorageService } from '../services/local-storage.service';

/**
 * Dernière barrière côté frontend : aucune erreur HTTP ne doit disparaître.
 * - journalise l'erreur (console.error avec contexte) ;
 * - notifie l'utilisateur via le ToastService si aucun message local ne l'a fait ;
 * - 401 : session expirée → redirection vers le login ;
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

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        const backendMessage = err?.error?.message || err?.error?.error;
        const message = backendMessage || ErrorInterceptorService.MESSAGES[err.status] || `Erreur ${err.status}`;

        console.error(`[HTTP_ERROR] ${req.method} ${req.urlWithParams} → ${err.status}`, {
          code: err?.error?.code,
          message,
          detail: err?.error
        });

        if (err.status === 401) {
          this.toast.error(message);
          this.localStorageService.remove(LocalStorageService.AUTH_TOKEN);
          this.router.navigate(['/auth/connexion']);
        } else if (!req.url.includes('/auth/login')) {
          // Notification par défaut : les composants qui gèrent déjà error: localement
          // afficheront leur propre message ; on évite ici les erreurs critiques muettes.
          this.toast.error(message);
        }

        return throwError(() => err);
      })
    );
  }
}
