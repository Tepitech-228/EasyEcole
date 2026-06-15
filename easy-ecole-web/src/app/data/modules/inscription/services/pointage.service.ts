import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Pointage } from '../models/Pointage.model';

@Injectable({
  providedIn: 'root'
})
export class PointageService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/pointages`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<Pointage[]> {
    return this.httpClient.get<Pointage[]>(`${this.SERVICE_URL}`)
  }

  getToday(): Observable<Pointage | null> {
    return this.httpClient.get<Pointage | null>(`${this.SERVICE_URL}/today`)
  }

  pointerArrivee(): Observable<Pointage> {
    return this.httpClient.post<Pointage>(`${this.SERVICE_URL}/arrivee`, {})
  }

  pointerDepart(): Observable<Pointage> {
    return this.httpClient.post<Pointage>(`${this.SERVICE_URL}/depart`, {})
  }

  pointerArriveeByScan(userId: string): Observable<Pointage> {
    return this.httpClient.post<Pointage>(`${this.SERVICE_URL}/scan/arrivee`, { userId })
  }
}
