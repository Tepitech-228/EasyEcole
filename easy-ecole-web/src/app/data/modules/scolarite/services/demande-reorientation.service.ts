import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DemandeReorientation } from '../models/DemandeReorientation.model';

@Injectable({ providedIn: 'root' })
export class DemandeReorientationService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.SCOLARITE}/reorientations`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<DemandeReorientation[]> {
    return this.httpClient.get<DemandeReorientation[]>(`${this.SERVICE_URL}/`)
  }

  get(id: string): Observable<DemandeReorientation> {
    return this.httpClient.get<DemandeReorientation>(`${this.SERVICE_URL}/${id}`)
  }

  create(data: DemandeReorientation): Observable<DemandeReorientation> {
    return this.httpClient.post<DemandeReorientation>(`${this.SERVICE_URL}`, data)
  }

  update(data: DemandeReorientation): Observable<DemandeReorientation> {
    return this.httpClient.put<DemandeReorientation>(`${this.SERVICE_URL}/${data.id!}`, data)
  }

  traiter(id: string, statut: string, traitePar: number): Observable<DemandeReorientation> {
    return this.httpClient.put<DemandeReorientation>(`${this.SERVICE_URL}/traiter/${id}`, { statut, traitePar })
  }
}
