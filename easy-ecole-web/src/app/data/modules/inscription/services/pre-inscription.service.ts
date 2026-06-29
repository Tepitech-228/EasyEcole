import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PreInscription } from '../models/PreInscription.model';
import { DemandeInscription } from '../models/DemandeInscription.model';

@Injectable({
  providedIn: 'root'
})
export class PreInscriptionService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/pre-inscriptions`

  constructor(private httpClient: HttpClient) { }

  getAll(params?: any): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.SERVICE_URL}`, { params })
  }

  getDemandesEnAttente(): Observable<DemandeInscription[]> {
    return this.httpClient.get<DemandeInscription[]>(`${this.SERVICE_URL}/demandes-en-attente`)
  }

  getAllDemandes(): Observable<DemandeInscription[]> {
    return this.httpClient.get<DemandeInscription[]>(`${this.SERVICE_URL}/all-demandes`)
  }

  getDemandeDetails(id: string): Observable<DemandeInscription> {
    return this.httpClient.get<DemandeInscription>(`${this.SERVICE_URL}/demande/${id}`)
  }

  soumettre(demandeInscriptionId: string): Observable<PreInscription> {
    return this.httpClient.post<PreInscription>(`${this.SERVICE_URL}/${demandeInscriptionId}/soumettre`, {})
  }

  get(id: string): Observable<any> {
    return this.httpClient.get<any>(`${this.SERVICE_URL}/${id}`)
  }

  valider(demandeInscriptionId: string, commentaire?: string): Observable<PreInscription> {
    return this.httpClient.put<PreInscription>(`${this.SERVICE_URL}/${demandeInscriptionId}/valider`, { commentaire })
  }

  rejeter(demandeInscriptionId: string, commentaire: string): Observable<PreInscription> {
    return this.httpClient.put<PreInscription>(`${this.SERVICE_URL}/${demandeInscriptionId}/rejeter`, { commentaire })
  }

  telechargerAutorisation(preInscriptionId: string): Observable<Blob> {
    return this.httpClient.get(`${this.SERVICE_URL}/${preInscriptionId}/autorisation`, { responseType: 'blob' })
  }
}
