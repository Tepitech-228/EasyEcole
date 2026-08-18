import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface RegleEvaluation {
  id?: number
  parcoursId?: number | null
  semestre?: string | null
  type: 'compensation' | 'seuil_eliminatoire' | 'note_minimale' | 'validation_credit' | 'regle_passage' | string
  valeur: string
  actif?: boolean
  description?: string | null
}

/**
 * Service d'accès aux règles d'évaluation (`/api/v1/inscription/regles-evaluation`).
 * Contrat backend (RegleEvaluationController) : GET / POST / PUT /:id / DELETE /:id.
 * Le modèle est une liste de règles clé/valeur (type + valeur), éventuellement
 * liées à un parcours ou un semestre.
 */
@Injectable({
  providedIn: 'root'
})
export class RegleEvaluationService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/regles-evaluation`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<RegleEvaluation[]> {
    return this.httpClient.get<RegleEvaluation[]>(this.SERVICE_URL)
  }

  get(id: number): Observable<RegleEvaluation> {
    return this.httpClient.get<RegleEvaluation>(`${this.SERVICE_URL}/${id}`)
  }

  create(regle: RegleEvaluation): Observable<RegleEvaluation> {
    return this.httpClient.post<RegleEvaluation>(this.SERVICE_URL, regle)
  }

  update(regle: RegleEvaluation): Observable<RegleEvaluation> {
    return this.httpClient.put<RegleEvaluation>(`${this.SERVICE_URL}/${regle.id}`, regle)
  }

  delete(id: number): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
