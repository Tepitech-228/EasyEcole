import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class RecuCaisseService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.SCOLARITE}/secretariat/recusCaisse`

  constructor(private httpClient: HttpClient) { }

  getAll(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, String(params[key]));
        }
      });
    }
    return this.httpClient.get<any>(`${this.SERVICE_URL}/`, { params: httpParams });
  }

  get(id: string): Observable<any> {
    return this.httpClient.get<any>(`${this.SERVICE_URL}/${id}`);
  }

  print(id: string): Observable<any> {
    return this.httpClient.get(`${this.SERVICE_URL}/${id}/print`, { responseType: 'text' });
  }

  collecterPaiement(demandeId: string, modePaiement: string, montant: number): Observable<any> {
    return this.httpClient.post<any>(`${this.SERVICE_URL}/collecter`, { demandeId, modePaiement, montant });
  }

  getJournalCaisse(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, String(params[key]));
        }
      });
    }
    return this.httpClient.get<any>(`${environment.API_MODULES.SCOLARITE}/secretariat/journalCaisse`, { params: httpParams });
  }
}
