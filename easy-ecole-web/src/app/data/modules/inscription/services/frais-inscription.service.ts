import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FraisInscription } from '../models/FraisInscription.model';

@Injectable({
  providedIn: 'root'
})
export class FraisInscriptionService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/fraisInscription`

  constructor(private httpClient: HttpClient) { }

  get(id: string): Observable<FraisInscription> {
    return this.httpClient.get<FraisInscription>(`${this.SERVICE_URL}/${id}`)
  }

  create(fraisInscription: FraisInscription): Observable<FraisInscription> {
    return this.httpClient.post<FraisInscription>(`${this.SERVICE_URL}`, fraisInscription)
  }

  update(fraisInscription: FraisInscription): Observable<FraisInscription> {
    return this.httpClient.put<FraisInscription>(`${this.SERVICE_URL}/${fraisInscription.id!}`, fraisInscription)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
