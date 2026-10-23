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

  getAll(params?: any): Observable<Session[]> {
    return this.httpClient.get<Session[]>(`${this.SERVICE_URL}`, { params })
  }

  get(id: string): Observable<Session> {
    return this.httpClient.get<Session>(`${this.SERVICE_URL}/${id}`)
  }

  create(session: Session): Observable<Session> {
    return this.httpClient.post<Session>(`${this.SERVICE_URL}`, session)
  }

  update(id: string, session: Partial<Session>): Observable<Session> {
    return this.httpClient.put<Session>(`${this.SERVICE_URL}/${id}`, session)
  }

  delete(id: string): Observable<{ success: boolean, message?: string }> {
    return this.httpClient.delete<{ success: boolean, message?: string }>(`${this.SERVICE_URL}/${id}`)
  }

  getCount(): Observable<{ success: boolean, count: number }> {
    return this.httpClient.get<{ success: boolean, count: number }>(`${this.SERVICE_URL}/statistics/count`)
  }
}
