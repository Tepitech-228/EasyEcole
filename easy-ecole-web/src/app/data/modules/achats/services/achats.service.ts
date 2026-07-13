import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AchatsService {
  private readonly URL = `${environment.API_MODULES.STOCKS || environment.API_URL}/achats`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.URL);
  }

  get(id: string): Observable<any> {
    return this.http.get<any>(`${this.URL}/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post(this.URL, data);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put(`${this.URL}/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.URL}/${id}`);
  }

  getDemandes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.URL}/demandes`);
  }

  getCommandes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.URL}/commandes`);
  }
}
