import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SurveillanceDashboard, DisciplineIncident } from '../models/Surveillance.model';

@Injectable({
  providedIn: 'root'
})
export class SurveillanceService {

  private readonly SERVICE_URL: string = `${environment.API_URL}/surveillance`

  constructor(private httpClient: HttpClient) { }

  getDashboard(): Observable<SurveillanceDashboard> {
    return this.httpClient.get<SurveillanceDashboard>(`${this.SERVICE_URL}/dashboard`)
  }

  getDisciplineDuJour(): Observable<DisciplineIncident[]> {
    return this.httpClient.get<DisciplineIncident[]>(`${this.SERVICE_URL}/discipline-du-jour`)
  }

  getPresencesDuJour(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.SERVICE_URL}/presences-du-jour`)
  }

  createIncident(data: Partial<DisciplineIncident>): Observable<DisciplineIncident> {
    return this.httpClient.post<DisciplineIncident>(`${this.SERVICE_URL}/incidents`, data)
  }

  updateIncident(id: string, data: Partial<DisciplineIncident>): Observable<DisciplineIncident> {
    return this.httpClient.put<DisciplineIncident>(`${this.SERVICE_URL}/incidents/${id}`, data)
  }
}
