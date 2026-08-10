import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RhReportingService {
  private readonly BASE = `${environment.API_MODULES.RH}/reportings`;

  constructor(private httpClient: HttpClient) {}

  getStats(): Observable<any> {
    return this.httpClient.get<any>(`${this.BASE}/stats`);
  }

  getMasseSalariale(): Observable<any> {
    return this.httpClient.get<any>(`${this.BASE}/masse-salariale`);
  }

  getEffectifs(): Observable<any> {
    return this.httpClient.get<any>(`${this.BASE}/effectifs`);
  }

  getSituationPrets(): Observable<any> {
    return this.httpClient.get<any>(`${this.BASE}/situation-prets`);
  }
}
