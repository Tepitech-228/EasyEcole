import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Presence } from '../models/Presence.model';

@Injectable({
  providedIn: 'root'
})
export class PresenceService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/presences`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<Presence[]> {
    return this.httpClient.get<Presence[]>(`${this.SERVICE_URL}/`)
  }

  get(id: string): Observable<Presence> {
    return this.httpClient.get<Presence>(`${this.SERVICE_URL}/${id}`)
  }

  create(presence: Presence): Observable<Presence> {
    return this.httpClient.post<Presence>(`${this.SERVICE_URL}`, presence)
  }

  update(presence: Presence): Observable<Presence> {
    return this.httpClient.put<Presence>(`${this.SERVICE_URL}/${presence.id!}`, presence)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
