import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DemandeInscriptionDossier } from '../models/DemandeInscriptionDossier.model';
import { DossierInscription } from '../models/DossierInscription.model';

@Injectable({
  providedIn: 'root'
})
export class DossierInscriptionService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/dossiersInscription`

  constructor(private httpClient: HttpClient) { }

  get(id: string): Observable<DossierInscription> {
    return this.httpClient.get<DossierInscription>(`${this.SERVICE_URL}/${id}`)
  }

  create(dossierInscription: DossierInscription): Observable<DossierInscription> {
    return this.httpClient.post<DossierInscription>(`${this.SERVICE_URL}`, dossierInscription)
  }

  upload(demandeInscriptionDossier: DemandeInscriptionDossier, fichier: File): Observable<DemandeInscriptionDossier> {
    let formData: FormData = new FormData()
    if (demandeInscriptionDossier.dossierId) {
      formData.append('dossierId', demandeInscriptionDossier.dossierId)
    }
    if (demandeInscriptionDossier.demandeId) {
      formData.append('demandeId', demandeInscriptionDossier.demandeId)
    }
    if (fichier) {
      formData.append('fichier', fichier, fichier.name)
    }

    return this.httpClient.put<DemandeInscriptionDossier>(`${this.SERVICE_URL}`, formData)
  }

  update(dossierInscription: DossierInscription): Observable<DossierInscription> {
    return this.httpClient.put<DossierInscription>(`${this.SERVICE_URL}/${dossierInscription.id!}`, dossierInscription)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
