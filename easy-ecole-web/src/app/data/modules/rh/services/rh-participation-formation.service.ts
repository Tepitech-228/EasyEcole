import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RhParticipationFormation } from '../models/RhParticipationFormation.model';

@Injectable({
  providedIn: 'root'
})
export class RhParticipationFormationService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.RH}/participations-formation`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<RhParticipationFormation[]> {
    return this.httpClient.get<RhParticipationFormation[]>(this.SERVICE_URL);
  }

  get(id: string): Observable<RhParticipationFormation> {
    return this.httpClient.get<RhParticipationFormation>(`${this.SERVICE_URL}/${id}`);
  }

  create(item: RhParticipationFormation): Observable<RhParticipationFormation> {
    return this.httpClient.post<RhParticipationFormation>(this.SERVICE_URL, item);
  }

  update(item: RhParticipationFormation): Observable<RhParticipationFormation> {
    return this.httpClient.put<RhParticipationFormation>(`${this.SERVICE_URL}/${item.id!}`, item);
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`);
  }
}