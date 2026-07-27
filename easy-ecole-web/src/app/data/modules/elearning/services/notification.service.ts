import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Notification {
  id: number;
  utilisateurId: number;
  type: string;
  titre?: string;
  message: string;
  lu: boolean;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.ELEARNING}/notifications`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<Notification[]> {
    return this.httpClient.get<Notification[]>(`${this.SERVICE_URL}`)
  }

  marquerLu(id: number): Observable<any> {
    return this.httpClient.put(`${this.SERVICE_URL}/${id}/lu`, {})
  }

  publierEmploiDuTemps(): Observable<{ success: boolean; message: string; enseignantsNotifies: number; etudiantsNotifies: number }> {
    return this.httpClient.post<any>(`${environment.API_MODULES.INSCRIPTION}/seances/publier`, {})
  }
}
