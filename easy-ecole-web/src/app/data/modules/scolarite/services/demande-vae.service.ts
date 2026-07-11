import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DemandeVAE } from '../models/DemandeVAE.model';

@Injectable({ providedIn: 'root' })
export class DemandeVAEService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.SCOLARITE}/demandes-vae`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<DemandeVAE[]> {
    return this.httpClient.get<DemandeVAE[]>(`${this.SERVICE_URL}/`)
  }

  get(id: string): Observable<DemandeVAE> {
    return this.httpClient.get<DemandeVAE>(`${this.SERVICE_URL}/${id}`)
  }

  create(data: DemandeVAE): Observable<DemandeVAE> {
    return this.httpClient.post<DemandeVAE>(`${this.SERVICE_URL}`, data)
  }

  update(data: DemandeVAE): Observable<DemandeVAE> {
    return this.httpClient.put<DemandeVAE>(`${this.SERVICE_URL}/${data.id!}`, data)
  }

  traiter(id: string, statut: string): Observable<DemandeVAE> {
    return this.httpClient.put<DemandeVAE>(`${this.SERVICE_URL}/traiter/${id}`, { statut })
  }
}
