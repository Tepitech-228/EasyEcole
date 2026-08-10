import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ParametreFrais, TypeParametreFrais } from '../models/ParametreFrais.model';

export interface ParametreFraisQuery {
  module?: string;
  type?: TypeParametreFrais;
}

@Injectable({ providedIn: 'root' })
export class ParametreFraisService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.COMPTABILITE}/parametres-frais`

  constructor(private httpClient: HttpClient) { }

  /** Liste complète des paramètres de frais (filtres optionnels module/type) */
  getAll(params?: ParametreFraisQuery): Observable<ParametreFrais[]> {
    let httpParams = new HttpParams();
    if (params?.module) httpParams = httpParams.set('module', params.module);
    if (params?.type) httpParams = httpParams.set('type', params.type);
    return this.httpClient.get<ParametreFrais[]>(`${this.SERVICE_URL}/`, { params: httpParams });
  }

  /** Retourne uniquement les montants (type 'montant') — usage affichage des frais */
  getPublic(): Observable<ParametreFrais[]> {
    return this.httpClient.get<ParametreFrais[]>(`${this.SERVICE_URL}/public`);
  }

  /** Création (ADMIN uniquement) */
  create(data: Partial<ParametreFrais>): Observable<ParametreFrais> {
    return this.httpClient.post<ParametreFrais>(`${this.SERVICE_URL}/`, data);
  }

  /** Mise à jour */
  update(id: number, data: Partial<ParametreFrais>): Observable<ParametreFrais> {
    return this.httpClient.put<ParametreFrais>(`${this.SERVICE_URL}/${id}`, data);
  }

  /** Suppression (soft delete) */
  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.httpClient.delete<{ success: boolean; message: string }>(`${this.SERVICE_URL}/${id}`);
  }
}
