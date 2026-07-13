import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DeliberationService {
  private apiUrl = `${environment.API_URL}/inscription/deliberations`;

  constructor(private http: HttpClient) {}

  getAll(params?: any): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params });
  }

  getOne(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  chargerResultats(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/charger-resultats`, {});
  }

  mettreAJourDecision(id: number, resultatId: number, decision: string, extra?: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/resultats/${resultatId}`, { decision, ...extra });
  }

  cloturer(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/cloturer`, {});
  }

  publier(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/publier`, {});
  }

  contester(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/contester`, {});
  }

  verrouiller(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/verrouiller`, {});
  }

  deverrouiller(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/deverrouiller`, {});
  }

  genererPV(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/generer-pv`, {});
  }

  telechargerPV(filename: string): string {
    return `${this.apiUrl}/pv/${filename}`;
  }

  calculerSuggestions(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/suggestions`);
  }

  getHistorique(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/historique`);
  }

  getDettes(deliberationId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${deliberationId}/dettes`);
  }
}
