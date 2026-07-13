import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ListePresence } from '../models/ListePresence.model';
import { Presence } from '../models/Presence.model';

@Injectable({
  providedIn: 'root'
})
export class ListePresenceService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/listesPresences`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<ListePresence[]> {
    return this.httpClient.get<ListePresence[]>(`${this.SERVICE_URL}`)
  }

  get(id: string): Observable<ListePresence> {
    return this.httpClient.get<ListePresence>(`${this.SERVICE_URL}/${id}`)
  }

  create(listePresence: ListePresence): Observable<ListePresence> {
    return this.httpClient.post<ListePresence>(`${this.SERVICE_URL}`, listePresence)
  }

  update(listePresence: ListePresence): Observable<ListePresence> {
    return this.httpClient.put<ListePresence>(`${this.SERVICE_URL}/${listePresence.id!}`, listePresence)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
