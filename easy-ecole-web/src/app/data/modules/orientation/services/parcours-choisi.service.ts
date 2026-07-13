import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ParcoursChoisi } from '../models/ParcoursChoisi.model';

@Injectable({
  providedIn: 'root'
})
export class ParcoursChoisiService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.ORIENTATION}/parcoursChoisis`

  constructor(private httpClient: HttpClient) { }

  get(id: string): Observable<ParcoursChoisi> {
    return this.httpClient.get<ParcoursChoisi>(`${this.SERVICE_URL}/${id}`)
  }

  create(parcoursChoisi: ParcoursChoisi): Observable<ParcoursChoisi> {
    return this.httpClient.post<ParcoursChoisi>(`${this.SERVICE_URL}`, parcoursChoisi)
  }

  update(parcoursChoisi: ParcoursChoisi): Observable<ParcoursChoisi> {
    return this.httpClient.put<ParcoursChoisi>(`${this.SERVICE_URL}/${parcoursChoisi.id!}`, parcoursChoisi)
  }
}
