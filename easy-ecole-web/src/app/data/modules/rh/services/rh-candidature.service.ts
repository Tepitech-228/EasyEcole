import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RhCandidature } from '../models/RhCandidature.model';

@Injectable({
  providedIn: 'root'
})
export class RhCandidatureService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.RH}/candidatures`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<RhCandidature[]> {
    return this.httpClient.get<RhCandidature[]>(this.SERVICE_URL);
  }

  get(id: string): Observable<RhCandidature> {
    return this.httpClient.get<RhCandidature>(`${this.SERVICE_URL}/${id}`);
  }

  create(item: RhCandidature): Observable<RhCandidature> {
    return this.httpClient.post<RhCandidature>(this.SERVICE_URL, item);
  }

  update(item: RhCandidature): Observable<RhCandidature> {
    return this.httpClient.put<RhCandidature>(`${this.SERVICE_URL}/${item.id!}`, item);
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`);
  }
}