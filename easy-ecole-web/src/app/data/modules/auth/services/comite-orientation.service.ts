import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ComiteOrientationService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.AUTH}/comiteOrientation`

  constructor(private httpClient: HttpClient) { }

  getProfile(): Observable<any> {
    return this.httpClient.get(`${this.SERVICE_URL}`)
  }

  updateProfile(data: { fonction: string; estPrescripteur: boolean }): Observable<any> {
    return this.httpClient.put(`${this.SERVICE_URL}`, data)
  }

  ajouterUeEtudiant(data: { utilisateurId: string; parcoursId: number; ueIds: number[] }): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/ajouter-ue-etudiant`, data)
  }
}
