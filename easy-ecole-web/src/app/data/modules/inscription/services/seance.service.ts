import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Seance } from '../models/Seance.model';

@Injectable({
  providedIn: 'root'
})
export class SeanceService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/seances`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<Seance[]> {
    return this.httpClient.get<Seance[]>(`${this.SERVICE_URL}`)
  }

  get(id: string): Observable<Seance> {
    return this.httpClient.get<Seance>(`${this.SERVICE_URL}/${id}`)
  }

  create(seance: Seance): Observable<Seance> {
    return this.httpClient.post<Seance>(`${this.SERVICE_URL}`, seance)
  }

  update(seance: Seance): Observable<Seance> {
    return this.httpClient.put<Seance>(`${this.SERVICE_URL}/${seance.id!}`, seance)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
