import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Validateur } from '../models/achats.models';

@Injectable({ providedIn: 'root' })
export class ValidateurService {
  private readonly URL = `${environment.API_MODULES.ACHATS}/validateurs`;

  constructor(private http: HttpClient) {}

  /** Liste les validateurs actifs (avec utilisateur inclus). */
  getAll(): Observable<Validateur[]> {
    return this.http.get<Validateur[]>(this.URL);
  }

  create(data: Partial<Validateur>): Observable<Validateur> {
    return this.http.post<Validateur>(this.URL, data);
  }

  update(id: number | string, data: Partial<Validateur>): Observable<Validateur> {
    return this.http.put<Validateur>(`${this.URL}/${id}`, data);
  }

  delete(id: number | string): Observable<any> {
    return this.http.delete(`${this.URL}/${id}`);
  }
}
