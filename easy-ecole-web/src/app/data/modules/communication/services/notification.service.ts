import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface CommunicationNotification {
  id: number;
  utilisateurId: number;
  type: string;
  titre?: string;
  message: string;
  lien?: string;
  lu: boolean;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CommunicationNotificationService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.ELEARNING}/notifications`

  constructor(private httpClient: HttpClient) { }

  getNotifications(): Observable<CommunicationNotification[]> {
    return this.httpClient.get<CommunicationNotification[]>(`${this.SERVICE_URL}`)
  }

  getNonLues(): Observable<CommunicationNotification[]> {
    return this.httpClient.get<CommunicationNotification[]>(`${this.SERVICE_URL}?lu=false`)
  }

  marquerLue(id: number): Observable<any> {
    return this.httpClient.put(`${this.SERVICE_URL}/${id}/lu`, {})
  }

  marquerToutesLues(): Observable<any> {
    return this.httpClient.put(`${this.SERVICE_URL}/lire-toutes`, {})
  }

  getCount(): Observable<{ count: number }> {
    return this.httpClient.get<{ count: number }>(`${this.SERVICE_URL}/count`)
  }
}
