import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AdministrationService {
  private readonly BASE = `${environment.API_URL}/administration`;

  constructor(private http: HttpClient) {}

  getQrCodes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/qr-codes`);
  }

  generateQrCode(entityId: string, entityType: string): Observable<any> {
    return this.http.post(`${this.BASE}/qr-codes`, { entityId, entityType });
  }

  getCartes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/cartes`);
  }

  createCarte(data: any): Observable<any> {
    return this.http.post(`${this.BASE}/cartes`, data);
  }

  getAuditLogs(params?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/audit`, { params });
  }

  getConfiguration(): Observable<any> {
    return this.http.get(`${this.BASE}/configuration`);
  }

  updateConfiguration(config: any): Observable<any> {
    return this.http.put(`${this.BASE}/configuration`, config);
  }
}
