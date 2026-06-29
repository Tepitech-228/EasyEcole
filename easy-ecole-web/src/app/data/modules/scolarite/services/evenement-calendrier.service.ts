import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EvenementCalendrier } from '../models/EvenementCalendrier.model';

@Injectable({ providedIn: 'root' })
export class EvenementCalendrierService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.SCOLARITE}/calendrier`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<EvenementCalendrier[]> {
    return this.httpClient.get<EvenementCalendrier[]>(`${this.SERVICE_URL}/`)
  }

  get(id: string): Observable<EvenementCalendrier> {
    return this.httpClient.get<EvenementCalendrier>(`${this.SERVICE_URL}/${id}`)
  }

  create(data: EvenementCalendrier): Observable<EvenementCalendrier> {
    return this.httpClient.post<EvenementCalendrier>(`${this.SERVICE_URL}`, data)
  }

  update(data: EvenementCalendrier): Observable<EvenementCalendrier> {
    return this.httpClient.put<EvenementCalendrier>(`${this.SERVICE_URL}/${data.id!}`, data)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
