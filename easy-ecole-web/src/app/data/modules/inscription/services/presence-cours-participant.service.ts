import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PresenceCoursParticipant } from '../models/PresenceCoursParticipant.model';

@Injectable({
  providedIn: 'root'
})
export class PresenceCoursParticipantService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/presencesCoursParticipants`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<PresenceCoursParticipant[]> {
    return this.httpClient.get<PresenceCoursParticipant[]>(`${this.SERVICE_URL}`)
  }

  get(id: string): Observable<PresenceCoursParticipant> {
    return this.httpClient.get<PresenceCoursParticipant>(`${this.SERVICE_URL}/${id}`)
  }

  create(presenceCoursParticipant: PresenceCoursParticipant): Observable<PresenceCoursParticipant> {
    return this.httpClient.post<PresenceCoursParticipant>(`${this.SERVICE_URL}`, presenceCoursParticipant)
  }

  update(presenceCoursParticipant: PresenceCoursParticipant): Observable<PresenceCoursParticipant> {
    return this.httpClient.put<PresenceCoursParticipant>(`${this.SERVICE_URL}/${presenceCoursParticipant.presenceId!}`, presenceCoursParticipant)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
