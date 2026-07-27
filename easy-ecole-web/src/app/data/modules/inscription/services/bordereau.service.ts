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

  batchValider(ids: number[], commentaire?: string): Observable<{ success: boolean; count: number }> {
    return this.httpClient.put<{ success: boolean; count: number }>(`${this.SERVICE_URL}/batch/statut`, { ids, statut: 'valide', commentaire });
  }

  batchRejeter(ids: number[], commentaire: string): Observable<{ success: boolean; count: number }> {
    return this.httpClient.put<{ success: boolean; count: number }>(`${this.SERVICE_URL}/batch/statut`, { ids, statut: 'rejete', commentaire });
  }
}
