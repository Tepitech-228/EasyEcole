import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Echeance } from '../models/Echeance.model';

@Injectable({
  providedIn: 'root'
})
export class EcheanceService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/echeances`

  constructor(private httpClient: HttpClient) { }

  getAll(params?: any): Observable<Echeance[]> {
    return this.httpClient.get<Echeance[]>(`${this.SERVICE_URL}`, { params })
  }

  get(id: string): Observable<Echeance> {
    return this.httpClient.get<Echeance>(`${this.SERVICE_URL}/${id}`)
  }

  create(echeance: any): Observable<Echeance> {
    return this.httpClient.post<Echeance>(`${this.SERVICE_URL}`, echeance)
  }

  update(id: string, echeance: any): Observable<Echeance> {
    return this.httpClient.put<Echeance>(`${this.SERVICE_URL}/${id}`, echeance)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }

  generer(dossierEtudiantId: string): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/generer/${dossierEtudiantId}`, {})
  }
}
