import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FeuillePresenceService {
  private apiUrl = `${environment.API_URL}/inscription`;

  constructor(private http: HttpClient) {}

  getPresencesParSeance(seanceId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/seances/${seanceId}/presences`);
  }

  genererPresences(seanceId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/seances/${seanceId}/generer-presences`, {});
  }

  mettreAJourEtat(id: number, etat: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/presences-cours-participants/${id}`, { etat });
  }

  mettreAJourMassive(data: { ids: number[]; etat: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/presences-cours-participants/massive`, data);
  }
}
