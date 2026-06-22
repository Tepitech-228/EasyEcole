import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DossierEtudiant } from '../models/DossierEtudiant.model';

@Injectable({
  providedIn: 'root'
})
export class DossierEtudiantService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/dossiers`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<DossierEtudiant[]> {
    return this.httpClient.get<DossierEtudiant[]>(`${this.SERVICE_URL}`)
  }

  get(id: string): Observable<DossierEtudiant> {
    return this.httpClient.get<DossierEtudiant>(`${this.SERVICE_URL}/${id}`)
  }

  getMonDossier(): Observable<DossierEtudiant> {
    return this.httpClient.get<DossierEtudiant>(`${this.SERVICE_URL}/mon-dossier`)
  }

  generer(dossier: any): Observable<DossierEtudiant> {
    return this.httpClient.post<DossierEtudiant>(`${this.SERVICE_URL}/generer`, dossier)
  }

  getStatut(matricule: string): Observable<any> {
    return this.httpClient.get(`${this.SERVICE_URL}/${matricule}/statut`)
  }

  update(id: string, data: any): Observable<DossierEtudiant> {
    return this.httpClient.put<DossierEtudiant>(`${this.SERVICE_URL}/${id}`, data)
  }
}
