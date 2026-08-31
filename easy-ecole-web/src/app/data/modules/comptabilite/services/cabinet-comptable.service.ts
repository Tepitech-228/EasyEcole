import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CabinetComptableService {
  private readonly baseUrl = `${environment.API_MODULES.INSCRIPTION}/cabinet-comptable`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard`);
  }

  getReferences(page: number = 1, limit: number = 20): Observable<any> {
    return this.http.get(`${this.baseUrl}/references`, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  getHistorique(page: number = 1, limit: number = 20): Observable<any> {
    return this.http.get(`${this.baseUrl}/historique`, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }
}
