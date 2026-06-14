import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Ressource } from '../models/Ressource.model';

@Injectable({
  providedIn: 'root'
})
export class RessourceService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/ressources`

  constructor(private httpClient: HttpClient) { }

  getAll(chapitreCoursId?: string): Observable<Ressource[]> {
    return this.httpClient.get<Ressource[]>(chapitreCoursId ? `${this.SERVICE_URL}?chapitreCoursId=${chapitreCoursId}` : `${this.SERVICE_URL}`)
  }

  get(id: string): Observable<Ressource> {
    return this.httpClient.get<Ressource>(`${this.SERVICE_URL}/${id}`)
  }

  create(ressource: Ressource): Observable<Ressource> {
    return this.httpClient.post<Ressource>(`${this.SERVICE_URL}`, ressource)
  }

  update(ressource: Ressource): Observable<Ressource> {
    return this.httpClient.put<Ressource>(`${this.SERVICE_URL}/${ressource.id!}`, ressource)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
