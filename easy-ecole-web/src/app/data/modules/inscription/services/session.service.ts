import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Session } from '../models/Session.model';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/sessions`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<Session[]> {
    return this.httpClient.get<Session[]>(`${this.SERVICE_URL}`)
  }

  get(id: string): Observable<Session> {
    return this.httpClient.get<Session>(`${this.SERVICE_URL}/${id}`)
  }

  create(session: Session): Observable<Session> {
    return this.httpClient.post<Session>(`${this.SERVICE_URL}`, session)
  }

  getCount(): Observable<{ success: boolean, count: number }> {
    return this.httpClient.get<{ success: boolean, count: number }>(`${this.SERVICE_URL}/statistics/count`)
  }
}
