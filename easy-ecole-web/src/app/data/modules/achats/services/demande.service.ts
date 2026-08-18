import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DemandeAchat } from '../models/achats.models';

@Injectable({ providedIn: 'root' })
export class DemandeService {
  private readonly URL = `${environment.API_MODULES.ACHATS}/demandes`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<DemandeAchat[]> {
    return this.http.get<DemandeAchat[]>(this.URL);
  }

  getMesDemandes(): Observable<DemandeAchat[]> {
    return this.http.get<DemandeAchat[]>(`${this.URL}/mes-demandes`);
  }

  get(id: number | string): Observable<DemandeAchat> {
    return this.http.get<DemandeAchat>(`${this.URL}/${id}`);
  }

  create(data: Partial<DemandeAchat>): Observable<DemandeAchat> {
    return this.http.post<DemandeAchat>(this.URL, data);
  }

  update(id: number | string, data: Partial<DemandeAchat>): Observable<DemandeAchat> {
    return this.http.put<DemandeAchat>(`${this.URL}/${id}`, data);
  }

  delete(id: number | string): Observable<any> {
    return this.http.delete(`${this.URL}/${id}`);
  }
}
