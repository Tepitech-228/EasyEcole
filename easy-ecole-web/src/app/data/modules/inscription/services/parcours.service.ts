import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Parcours } from '../models/Parcours.model';

@Injectable({
  providedIn: 'root'
})
export class ParcoursService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/parcours`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<Parcours[]> {
    return this.httpClient.get<Parcours[]>(`${this.SERVICE_URL}`)
  }

  get(id: string): Observable<Parcours> {
    return this.httpClient.get<Parcours>(`${this.SERVICE_URL}/${id}`)
  }

  create(parcours: Parcours): Observable<Parcours> {
    return this.httpClient.post<Parcours>(`${this.SERVICE_URL}`, parcours)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
