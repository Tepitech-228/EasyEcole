import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FraisScolarite } from '../models/FraisScolarite.model';

@Injectable({
  providedIn: 'root'
})
export class FraisScolariteService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/fraisScolarite`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<FraisScolarite[]> {
    return this.httpClient.get<FraisScolarite[]>(`${this.SERVICE_URL}`)
  }

  getBySession(sessionId: string): Observable<FraisScolarite | null> {
    return this.httpClient.get<FraisScolarite | null>(`${this.SERVICE_URL}/session/${sessionId}`)
  }

  upsert(fraisScolarite: FraisScolarite): Observable<FraisScolarite> {
    return this.httpClient.post<FraisScolarite>(`${this.SERVICE_URL}`, fraisScolarite)
  }
}
