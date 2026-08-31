import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/**
 * Service front de la réinscription planifiée.
 *
 * Base : `${environment.API_MODULES.INSCRIPTION}/reinscription`
 *
 * Règles métier (LMD) : la dette est AFFICHÉE à l'étudiant mais n'est PAS
 * bloquante pour la réinscription d'année en année ; le solde total n'est
 * exigé qu'à la validation du diplôme (Licence L3 / Master / Doctorat).
 */
@Injectable({ providedIn: 'root' })
export class ReinscriptionService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/reinscription`

  constructor(private httpClient: HttpClient) { }

  /** GET /peut-se-reinscrire — solvabilité (dette affichée, non bloquante). */
  peutSeReinscrire(): Observable<any> {
    return this.httpClient.get<any>(`${this.SERVICE_URL}/peut-se-reinscrire`)
  }

  /** GET /eligibilite — éligibilité (cursus actuel + dette + déjà inscrit). */
  getEligibilite(): Observable<any> {
    return this.httpClient.get<any>(`${this.SERVICE_URL}/eligibilite`)
  }

  /** POST /planifier — crée la planification (en_attente). */
  creerPlanification(body: { sessionId: number; classeId?: number; niveauEtudeId?: number; anneeAcademiqueId?: number }): Observable<any> {
    return this.httpClient.post<any>(`${this.SERVICE_URL}/planifier`, body)
  }

  /** GET /planifications — suivi des planifications de l'apprenant connecté. */
  getMesPlanifications(): Observable<any> {
    return this.httpClient.get<any>(`${this.SERVICE_URL}/planifications`)
  }

  /** POST /planifications/:id/annuler — annule (en_attente -> abandon). */
  annulerPlanification(id: number): Observable<any> {
    return this.httpClient.post<any>(`${this.SERVICE_URL}/planifications/${id}/annuler`, {})
  }

  /** POST /planifications/:id/confirmer — confirme (réservé admin/institution). */
  confirmerPlanification(id: number): Observable<any> {
    return this.httpClient.post<any>(`${this.SERVICE_URL}/planifications/${id}/confirmer`, {})
  }

  /** GET /sessions — sessions d'inscription (pour le choix de la session cible). */
  getSessions(): Observable<any> {
    return this.httpClient.get<any>(`${environment.API_MODULES.INSCRIPTION}/sessions`)
  }
}
