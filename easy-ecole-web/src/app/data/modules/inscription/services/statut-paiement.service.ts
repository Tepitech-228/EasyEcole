import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

/** Prochaine échéance à régler (renvoyée par GET /inscription/paiement/statut). */
export interface ProchaineEcheanceStatut {
  dateLimite: string | Date
  montant: number
}

/** Réponse de GET /inscription/paiement/statut (rôles apprenant / parent). */
export interface StatutPaiement {
  statut: 'vert' | 'rouge'
  message: string
  echeancesEnRetard?: number
  montantRestant?: number
  prochaineEcheance?: ProchaineEcheanceStatut | null
}

@Injectable({
  providedIn: 'root'
})
export class StatutPaiementService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/paiement/statut`

  constructor(private httpClient: HttpClient) { }

  /**
   * Statut de paiement de l'utilisateur connecté (apprenant ou parent).
   *
   * Retourne `null` de façon silencieuse en cas d'erreur (404 pour un étudiant
   * sans dossier, backend pas encore disponible, réseau…) afin de ne jamais casser l'UI.
   */
  getStatut(): Observable<StatutPaiement | null> {
    return this.httpClient.get<StatutPaiement>(this.SERVICE_URL).pipe(
      catchError(() => of(null))
    )
  }
}