import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DemandeDocument } from '../models/DemandeDocument.model';

@Injectable({ providedIn: 'root' })
export class DemandeDocumentService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.SCOLARITE}/demandesDocument`

  constructor(private httpClient: HttpClient) { }

  getAll(params?: any): Observable<{ data: DemandeDocument[], pagination: any }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, String(params[key]));
        }
      });
    }
    return this.httpClient.get<{ data: DemandeDocument[], pagination: any }>(`${this.SERVICE_URL}/`, { params: httpParams });
  }

  get(id: string): Observable<DemandeDocument> {
    return this.httpClient.get<DemandeDocument>(`${this.SERVICE_URL}/${id}`);
  }

  create(data: Partial<DemandeDocument>): Observable<DemandeDocument> {
    return this.httpClient.post<DemandeDocument>(`${this.SERVICE_URL}`, data);
  }

  updateStatus(id: string, statut: string): Observable<DemandeDocument> {
    return this.httpClient.put<DemandeDocument>(`${this.SERVICE_URL}/${id}`, { statut });
  }

  batchUpdateStatus(ids: number[], statut: string): Observable<{ success: boolean; count: number }> {
    return this.httpClient.put<{ success: boolean; count: number }>(`${this.SERVICE_URL}/batch/statut`, { ids, statut });
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`);
  }
}
