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

  /**
   * Arbre du suivi des échéances par étudiant (écran ESA-COMPTA) :
   * Année → Filière (parcours) → Niveau → Classe (salles) → étudiants.
   * Chaque étudiant porte totalDu / totalPaye / resteApayer / statut / echeances.
   */
  getSuiviEcheances(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, String(params[key]));
        }
      });
    }
    return this.httpClient.get<any[]>(`${environment.API_MODULES.INSCRIPTION}/finance/suivi-echeances`, { params: httpParams });
  }

  imputationPreview(id: string, montantPaiement: number, type?: string): Observable<any> {
    return this.httpClient.post<any>(`${environment.API_MODULES.INSCRIPTION}/finance/bordereaux/${id}/imputation-preview`, { montantPaiement, type })
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

  valider(id: string, commentaire?: string): Observable<Bordereau> {
    return this.httpClient.put<Bordereau>(`${this.SERVICE_URL}/${id}/valider`, { commentaire })
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
}
