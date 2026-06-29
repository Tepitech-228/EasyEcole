import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DemandeDocument } from '../models/DemandeDocument.model';

@Injectable({ providedIn: 'root' })
export class DemandeDocumentService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.SCOLARITE}/demandesDocument`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<DemandeDocument[]> {
    return this.httpClient.get<DemandeDocument[]>(`${this.SERVICE_URL}/`)
  }

  get(id: string): Observable<DemandeDocument> {
    return this.httpClient.get<DemandeDocument>(`${this.SERVICE_URL}/${id}`)
  }

  create(data: Partial<DemandeDocument>): Observable<DemandeDocument> {
    return this.httpClient.post<DemandeDocument>(`${this.SERVICE_URL}`, data)
  }

  updateStatus(id: string, statut: string): Observable<DemandeDocument> {
    return this.httpClient.put<DemandeDocument>(`${this.SERVICE_URL}/${id}`, { statut })
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
