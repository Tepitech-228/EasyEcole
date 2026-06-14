import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PaiementInscription } from '../models/PaiementInscription.model';

@Injectable({
  providedIn: 'root'
})
export class PaiementInscriptionService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/paiementsInscription`

  constructor(private httpClient: HttpClient) { }

  getAll(matricule?: string): Observable<PaiementInscription[]> {
    return this.httpClient.get<PaiementInscription[]>((matricule ? `${this.SERVICE_URL}?matricule=${matricule}` : `${this.SERVICE_URL}`))
  }

  get(id: string): Observable<PaiementInscription> {
    return this.httpClient.get<PaiementInscription>(`${this.SERVICE_URL}/${id}`)
  }

  create(paiementInscription: PaiementInscription): Observable<PaiementInscription> {
    return this.httpClient.post<PaiementInscription>(`${this.SERVICE_URL}`, paiementInscription)
  }

  createMobileMoney(paiementInscription: PaiementInscription): Observable<any> {
    return this.httpClient.post<any>(`${this.SERVICE_URL}/cinetpay`, paiementInscription)
  }

  update(paiementInscription: PaiementInscription): Observable<PaiementInscription> {
    return this.httpClient.put<PaiementInscription>(`${this.SERVICE_URL}/${paiementInscription.id!}`, paiementInscription)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
