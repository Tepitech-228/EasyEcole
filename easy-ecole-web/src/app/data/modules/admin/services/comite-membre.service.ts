import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Utilisateur } from 'src/app/data/modules/auth/models/Utilisateur.model';

@Injectable({
  providedIn: 'root'
})
export class ComiteMembreService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/admin/comite-membres`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<Utilisateur[]> {
    return this.httpClient.get<{data: Utilisateur[]}>(`${this.SERVICE_URL}`).pipe(
      map(res => res.data)
    )
  }

  create(payload: { nom: string; prenoms: string; email: string; identifiant: string; motDePasse?: string; contact?: string; estPrescripteur?: boolean }): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}`, payload)
  }

  setPrescripteur(id: number, estPrescripteur: boolean): Observable<any> {
    return this.httpClient.patch(`${this.SERVICE_URL}/${id}/prescripteur`, { estPrescripteur })
  }

  delete(id: number): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
