import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class SecretariatDashboardService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.SCOLARITE}/secretariat/dashboard`

  constructor(private httpClient: HttpClient) { }

  getStats(): Observable<any> {
    return this.httpClient.get<any>(`${this.SERVICE_URL}/stats`);
  }

  getRecentActivity(limit?: number): Observable<any> {
    const params = limit ? { limit: String(limit) } : undefined;
    return this.httpClient.get<any>(`${this.SERVICE_URL}/activity`, { params });
  }
}
