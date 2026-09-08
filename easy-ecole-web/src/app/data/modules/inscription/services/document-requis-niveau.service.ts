import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface DocumentRequisNiveau {
  id?: number;
  code: string;
  libelle: string;
  niveau: string;
  description?: string;
  ordre?: number;
  obligatoire?: boolean;
}

/**
 * Service du référentiel des documents obligatoires PAR NIVEAU d'inscription.
 * Ce référentiel est géré en base (CRUD) : il peut être allongé par
 * l'administration sans modification de code.
 */
@Injectable({
  providedIn: 'root'
})
export class DocumentRequisNiveauService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/documents-requis-niveau`

  constructor(private httpClient: HttpClient) { }

  /** Liste des documents obligatoires pour un niveau (ex: LICENCE 1, MASTER). */
  getByNiveau(niveau: string): Observable<DocumentRequisNiveau[]> {
    return this.httpClient.get<any>(this.SERVICE_URL, { params: { niveau: String(niveau) } })
      .pipe(map((res) => (res && Array.isArray(res.data) ? res.data : [])))
  }

  /** Liste complète du référentiel (gestion). */
  getAll(): Observable<DocumentRequisNiveau[]> {
    return this.httpClient.get<any>(this.SERVICE_URL)
      .pipe(map((res) => (res && Array.isArray(res.data) ? res.data : [])))
  }

  create(doc: Omit<DocumentRequisNiveau, 'id'>): Observable<any> {
    return this.httpClient.post<any>(this.SERVICE_URL, doc)
  }

  update(id: number | string, doc: Partial<DocumentRequisNiveau>): Observable<any> {
    return this.httpClient.put<any>(`${this.SERVICE_URL}/${id}`, doc)
  }

  delete(id: number | string): Observable<any> {
    return this.httpClient.delete<any>(`${this.SERVICE_URL}/${id}`)
  }
}
