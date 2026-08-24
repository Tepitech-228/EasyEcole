import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { DemandeInscription } from '../models/DemandeInscription.model';
import { Observable } from 'rxjs';
import { DemandeInscriptionCours } from '../models/DemandeInscriptionCours.model';
import { CursusApprenant } from '../models/CursusApprenant.model';

@Injectable({
  providedIn: 'root'
})
export class DemandeInscriptionService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/demandesInscription`

  constructor(private httpClient: HttpClient) { }

  getAll(params?: any): Observable<{ data: DemandeInscription[], pagination: any }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, String(params[key]));
        }
      });
    }
    return this.httpClient.get<{ data: DemandeInscription[], pagination: any }>(`${this.SERVICE_URL}`, { params: httpParams });
  }

  get(id: string): Observable<DemandeInscription> {
    return this.httpClient.get<DemandeInscription>(`${this.SERVICE_URL}/${id}`)
  }

  getFromPaiement(matricule: string): Observable<DemandeInscription> {
    return this.httpClient.get<DemandeInscription>(`${this.SERVICE_URL}/paiement/${matricule}`)
  }

  create(demandeInscription: DemandeInscription): Observable<DemandeInscription> {
    return this.httpClient.post<DemandeInscription>(`${this.SERVICE_URL}`, demandeInscription)
  }

  createCours(id: string, demandeInscriptionCours: DemandeInscriptionCours): Observable<DemandeInscriptionCours> {
    return this.httpClient.post<DemandeInscriptionCours>(`${this.SERVICE_URL}/${id}/cours`, demandeInscriptionCours)
  }

  updateCours(id: string, demandeInscriptionCours: DemandeInscriptionCours): Observable<DemandeInscriptionCours> {
    return this.httpClient.put<DemandeInscriptionCours>(`${this.SERVICE_URL}/${id}/cours`, demandeInscriptionCours)
  }

  valider(id: string, cursusApprenant: CursusApprenant): Observable<any> {
    return this.httpClient.put<any>(`${this.SERVICE_URL}/${id}`, {
      dateValidation: new Date(),
      cursusApprenant: cursusApprenant
    })
  }

  batchUpdateStatus(ids: number[], action: 'valider' | 'rejeter', commentaire?: string): Observable<{ success: boolean; count: number }> {
    return this.httpClient.put<{ success: boolean; count: number }>(`${this.SERVICE_URL}/batch/statut`, { ids, action, commentaire });
  }

  delete(id: string): Observable<{ success: boolean; message: string }> {
    return this.httpClient.delete<{ success: boolean; message: string }>(`${this.SERVICE_URL}/${id}`);
  }
}
