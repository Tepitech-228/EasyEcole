import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RhOffreEmploi } from '../models/RhOffreEmploi.model';

@Injectable({
  providedIn: 'root'
})
export class RhOffreEmploiService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.RH}/offres-emploi`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<RhOffreEmploi[]> {
    return this.httpClient.get<RhOffreEmploi[]>(this.SERVICE_URL);
  }

  get(id: string): Observable<RhOffreEmploi> {
    return this.httpClient.get<RhOffreEmploi>(`${this.SERVICE_URL}/${id}`);
  }

  create(item: RhOffreEmploi): Observable<RhOffreEmploi> {
    return this.httpClient.post<RhOffreEmploi>(this.SERVICE_URL, item);
  }

  update(item: RhOffreEmploi): Observable<RhOffreEmploi> {
    return this.httpClient.put<RhOffreEmploi>(`${this.SERVICE_URL}/${item.id!}`, item);
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`);
  }
}