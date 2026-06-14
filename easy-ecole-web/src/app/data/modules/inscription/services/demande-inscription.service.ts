import { HttpClient } from '@angular/common/http';
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

  getAll(): Observable<DemandeInscription[]> {
    return this.httpClient.get<DemandeInscription[]>(`${this.SERVICE_URL}`)
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
}
