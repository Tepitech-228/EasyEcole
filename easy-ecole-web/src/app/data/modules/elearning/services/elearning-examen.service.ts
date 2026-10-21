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
