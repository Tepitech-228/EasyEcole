import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ElearningExamenService {
  private readonly url = `${environment.API_MODULES.ELEARNING}/examens`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.url);
  }

  getStudentExams(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/apprenant`);
  }

  getCentres(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/centres`);
  }

  getMyCentres(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/centres/mes`);
  }

  createCentre(data: { nom: string; code: string; ville: string; adresse?: string; telephone?: string; capacite: number; responsableId: number }): Observable<any> {
    return this.http.post<any>(`${this.url}/centres`, data);
  }

  createSession(data: { examenId: number; centreId: number; dateExamen: string; capacite: number }): Observable<any> {
    return this.http.post<any>(`${this.url}/sessions`, data);
  }

  getAssignedSessions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/sessions/centre`);
  }

  reserveSession(sessionId: number): Observable<any> {
    return this.http.post<any>(`${this.url}/sessions/${sessionId}/reservations`, {});
  }

  cancelReservation(examenId: number): Observable<any> {
    return this.http.delete<any>(`${this.url}/examens/${examenId}/reservation`);
  }

  markAttendance(reservationId: number, statut: 'presente' | 'absente'): Observable<any> {
    return this.http.post<any>(`${this.url}/reservations/${reservationId}/presence`, { statut });
  }

  create(data: FormData): Observable<any> {
    return this.http.post<any>(this.url, data);
  }

  getSubject(id: number): Observable<Blob> {
    return this.http.get(`${this.url}/${id}/sujet`, { responseType: 'blob' });
  }

  downloadForPrint(id: number): Observable<Blob> {
    return this.http.get(`${this.url}/${id}/impression`, { responseType: 'blob' });
  }

  saveGrade(id: number, data: { utilisateurId: number; note: number; commentaire?: string }): Observable<any> {
    return this.http.post(`${this.url}/${id}/notes`, data);
  }
}
