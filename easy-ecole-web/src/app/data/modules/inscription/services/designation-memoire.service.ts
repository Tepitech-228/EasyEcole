import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DesignationMemoire } from '../models/DesignationMemoire.model';

/**
 * Service CRUD des désignations de directeur de mémoire.
 *
 * ⚠️ NOTE BACKEND : le modèle `DesignationMemoire` existe côté backend
 * (`easy-ecole-backend/src/modules/inscription/models/DesignationMemoire.ts`)
 * mais AUCUN routeur/contrôleur CRUD n'est encore exposé.
 * Les endpoints ci-dessous correspondent au standard REST du module inscription
 * (`/inscription/designation-memoires`) et devront être créés côté backend
 * pour que cet écran fonctionne en production.
 */
@Injectable({
  providedIn: 'root'
})
export class DesignationMemoireService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/designation-memoires`

  constructor(private httpClient: HttpClient) { }

  getAll(params?: any): Observable<{ data: DesignationMemoire[], pagination: { page: number, limit: number, total: number, totalPages: number } }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, String(params[key]));
        }
      });
    }
    return this.httpClient.get<{ data: DesignationMemoire[], pagination: { page: number, limit: number, total: number, totalPages: number } }>(`${this.SERVICE_URL}`, { params: httpParams });
  }

  get(id: string): Observable<DesignationMemoire> {
    return this.httpClient.get<DesignationMemoire>(`${this.SERVICE_URL}/${id}`)
  }

  create(data: Partial<DesignationMemoire>): Observable<DesignationMemoire> {
    return this.httpClient.post<DesignationMemoire>(`${this.SERVICE_URL}`, data)
  }

  update(id: string, data: Partial<DesignationMemoire>): Observable<DesignationMemoire> {
    return this.httpClient.put<DesignationMemoire>(`${this.SERVICE_URL}/${id}`, data)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
