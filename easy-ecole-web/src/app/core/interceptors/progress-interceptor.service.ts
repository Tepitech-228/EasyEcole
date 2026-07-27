import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { HttpLoaderService } from "../services/http-loader.service";
import { ToastService } from "../services/toast.service";

const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

@Injectable({
  providedIn: 'root'
})
export class ProgressInterceptorService implements HttpInterceptor {

  constructor(
    private httpLoaderService: HttpLoaderService,
    private toastService: ToastService,
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.httpLoaderService.show()

    return next.handle(req).pipe(
      tap((event) => {
        if (MUTATION_METHODS.includes(req.method) && event instanceof HttpResponse && event.status >= 200 && event.status < 300) {
          this.toastService.success('Opération effectuée avec succès')
        }
      }),
      catchError((error: HttpErrorResponse) => {
        // Construire un message d'erreur lisible
        let message = 'Une erreur est survenue'
        if (error.error?.message) {
          message = error.error.message
        } else if (error.error?.error) {
          message = error.error.error
        } else if (error.message) {
          message = error.message
        }

        // Gestion par code HTTP
        switch (error.status) {
          case 0:
            message = 'Impossible de contacter le serveur. Vérifiez votre connexion.'
            break
          case 400:
            message = message || 'Requête invalide'
            break
          case 401:
            message = message || 'Session expirée. Veuillez vous reconnecter.'
            break
          case 403:
            message = message || 'Accès refusé'
            break
          case 404:
            message = message || 'Ressource introuvable'
            break
          case 409:
            message = message || 'Conflit avec les données existantes'
            break
          case 422:
            message = message || 'Données invalides'
            break
          case 500:
            message = message || 'Erreur interne du serveur'
            break
        }

        // Logger en développement
        if (!environment.production) {
          console.error(`[ProgressInterceptor] ❌ ${req.method} ${req.url}`, {
            status: error.status,
            message,
            error
          })
        }

        // Toast pour les mutations uniquement (évite les doublons pour les GET)
        if (MUTATION_METHODS.includes(req.method)) {
          this.toastService.error(message)
        } else if (error.status >= 500) {
          // Afficher aussi les erreurs serveur sur les GET
          this.toastService.error(message)
        }

        return throwError(() => error)
      }),
      finalize(() => {
        this.httpLoaderService.hide()
      })
    )
  }
}
