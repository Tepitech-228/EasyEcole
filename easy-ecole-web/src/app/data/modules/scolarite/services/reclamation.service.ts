import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Reclamation } from '../models/Reclamation.model';

@Injectable({ providedIn: 'root' })
export class ReclamationService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.SCOLARITE}/reclamations`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<Reclamation[]> {
    return this.httpClient.get<Reclamation[]>(`${this.SERVICE_URL}/`)
  }

  get(id: string): Observable<Reclamation> {
    return this.httpClient.get<Reclamation>(`${this.SERVICE_URL}/${id}`)
  }

  create(data: Partial<Reclamation>): Observable<Reclamation> {
    return this.httpClient.post<Reclamation>(`${this.SERVICE_URL}`, data)
  }

  updateStatus(id: string, statut: string): Observable<Reclamation> {
    return this.httpClient.put<Reclamation>(`${this.SERVICE_URL}/${id}`, { statut })
  }

  repondre(reclamationId: string, reponse: string): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/repondre`, { reclamationId, reponse })
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
