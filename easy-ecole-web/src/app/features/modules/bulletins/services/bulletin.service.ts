import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BulletinService {
  private apiUrl = `${environment.apiUrl}/inscription/bulletins`;

  constructor(private http: HttpClient) {}

  getAll(params?: any): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  getOne(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  generer(classeId: number, semestre: string, anneeAcademiqueId: number): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/generer`, { classeId, semestre, anneeAcademiqueId });
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  publier(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/publier`, {});
  }

  monReleve(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/mon-releve`);
  }
}
