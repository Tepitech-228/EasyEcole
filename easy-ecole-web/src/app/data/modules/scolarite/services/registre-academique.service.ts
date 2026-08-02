import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RegistreAcademique } from '../models/RegistreAcademique.model';

export interface RegistreAcademiqueQuery {
  page?: number;
  limit?: number;
  anneeScolaire?: string;
  classe?: string;
  decision?: string;
  search?: string;
  filiere?: string;
  niveau?: string;
  [key: string]: any;
}

export interface GenererRegistresResult {
  success: boolean;
  crees: number;
  maj: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class RegistreAcademiqueService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.SCOLARITE}/registres`

  constructor(private httpClient: HttpClient) { }

  getAll(params?: RegistreAcademiqueQuery): Observable<any> {
    let httpParams = new HttpParams()
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, params[key])
        }
      })
    }
    return this.httpClient.get<any>(`${this.SERVICE_URL}/`, { params: httpParams })
  }

  /**
   * Upsert des registres académiques depuis une délibération clôturée ou publiée.
   * Route à appeler AVANT toute logique `/:id`.
   */
  generer(deliberationId: number): Observable<GenererRegistresResult> {
    return this.httpClient.post<GenererRegistresResult>(`${this.SERVICE_URL}/generer`, { deliberationId })
  }

  batchStatut(ids: number[], decision: string): Observable<any> {
    return this.httpClient.put(`${this.SERVICE_URL}/batch/statut`, { ids, decision })
  }

  get(id: string): Observable<RegistreAcademique> {
    return this.httpClient.get<RegistreAcademique>(`${this.SERVICE_URL}/${id}`)
  }

  create(data: RegistreAcademique): Observable<RegistreAcademique> {
    return this.httpClient.post<RegistreAcademique>(`${this.SERVICE_URL}`, data)
  }

  update(data: RegistreAcademique): Observable<RegistreAcademique> {
    return this.httpClient.put<RegistreAcademique>(`${this.SERVICE_URL}/${data.id!}`, data)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
