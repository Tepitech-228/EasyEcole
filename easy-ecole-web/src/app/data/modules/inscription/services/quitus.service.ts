import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Quitus } from '../models/Quitus.model';

@Injectable({
  providedIn: 'root'
})
export class QuitusService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/quitus`

  constructor(private httpClient: HttpClient) { }

  getAll(params?: any): Observable<Quitus[]> {
    return this.httpClient.get<Quitus[]>(`${this.SERVICE_URL}`, { params })
  }

  get(id: string): Observable<Quitus> {
    return this.httpClient.get<Quitus>(`${this.SERVICE_URL}/${id}`)
  }

  generer(paiementInscriptionId: string): Observable<Quitus> {
    return this.httpClient.post<Quitus>(`${this.SERVICE_URL}/generer`, { paiementInscriptionId })
  }
}
