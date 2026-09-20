import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Bordereau } from '../models/Bordereau.model';

@Injectable({
  providedIn: 'root'
})
export class BordereauService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/bordereaux`

  constructor(private httpClient: HttpClient) { }

  getAll(params?: any): Observable<{ data: Bordereau[], pagination: any }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, String(params[key]));
        }
      });
    }
    return this.httpClient.get<{ data: Bordereau[], pagination: any }>(`${this.SERVICE_URL}`, { params: httpParams });
  }

  getAImputer(params?: any): Observable<{ data: Bordereau[], pagination: any }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, String(params[key]));
        }
      });
    }
    return this.httpClient.get<{ data: Bordereau[], pagination: any }>(`${environment.API_MODULES.INSCRIPTION}/finance/bordereaux-a-traiter`, { params: httpParams });
  }

  imputationPreview(id: string, montantPaiement: number, type?: string): Observable<any> {
    return this.httpClient.post<any>(`${environment.API_MODULES.INSCRIPTION}/finance/bordereaux/${id}/imputation-preview`, { montantPaiement, type })
  }

  verifierUnicite(params: any): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        httpParams = httpParams.set(key, String(params[key]));
      }
    });
    return this.httpClient.get<any>(`${environment.API_MODULES.INSCRIPTION}/finance/bordereaux/verifier-unicite`, { params: httpParams });
  }

  verifierUniciteCabinet(params: any): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        httpParams = httpParams.set(key, String(params[key]));
      }
    });
    return this.httpClient.get<any>(`${this.SERVICE_URL}/verifier-unicite`, { params: httpParams });
  }

  compositionPreview(id: string, montantPaiement: number): Observable<any> {
    return this.httpClient.post<any>(`${environment.API_MODULES.INSCRIPTION}/finance/bordereaux/${id}/composition-preview`, { montantPaiement })
  }

  saisir(id: string, payload: any): Observable<any> {
    return this.httpClient.put<any>(`${environment.API_MODULES.INSCRIPTION}/finance/bordereaux/${id}/saisir`, payload)
  }

  get(id: string): Observable<Bordereau> {
    return this.httpClient.get<Bordereau>(`${this.SERVICE_URL}/${id}`)
  }

  upload(formData: FormData): Observable<Bordereau> {
    return this.httpClient.post<Bordereau>(`${this.SERVICE_URL}`, formData)
  }

  valider(id: string, payload: { referenceBancaire: string; numeroBordereau: string; datePaiement: string; commentaire?: string }): Observable<Bordereau> {
    return this.httpClient.put<Bordereau>(`${this.SERVICE_URL}/${id}/valider`, payload)
  }

  rejeter(id: string, commentaire: string): Observable<Bordereau> {
    return this.httpClient.put<Bordereau>(`${this.SERVICE_URL}/${id}/rejeter`, { commentaire })
  }

  traiter(id: string, payload: { type: string; montantConstate: number; referenceBancaire?: string; commentaire?: string }): Observable<{ success: boolean; data: Bordereau; lettrage: any }> {
    return this.httpClient.put<{ success: boolean; data: Bordereau; lettrage: any }>(`${this.SERVICE_URL}/${id}/traiter`, payload)
  }

  batchValider(ids: number[], commentaire?: string): Observable<{ success: boolean; count: number }> {
    return this.httpClient.put<{ success: boolean; count: number }>(`${this.SERVICE_URL}/batch/statut`, { ids, statut: 'valide', commentaire });
  }

  batchRejeter(ids: number[], commentaire: string): Observable<{ success: boolean; count: number }> {
    return this.httpClient.put<{ success: boolean; count: number }>(`${this.SERVICE_URL}/batch/statut`, { ids, statut: 'rejete', commentaire });
  }

  /**
   * GET /inscription/finance/situation-financiere
   * Liste paginée des étudiants avec leur situation financière complète.
   */
  getSituationFinanciere(params?: any): Observable<{ data: any[], pagination: any }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, String(params[key]));
        }
      });
    }
    return this.httpClient.get<{ data: any[], pagination: any }>(
      `${environment.API_MODULES.INSCRIPTION}/finance/situation-financiere`,
      { params: httpParams }
    );
  }

  /**
   * GET /inscription/finance/situation-financiere/:utilisateurId
   * Détail complet de la situation financière d'un étudiant.
   */
  getSituationDetail(utilisateurId: string): Observable<any> {
    return this.httpClient.get<any>(
      `${environment.API_MODULES.INSCRIPTION}/finance/situation-financiere/${utilisateurId}`
    );
  }
}
