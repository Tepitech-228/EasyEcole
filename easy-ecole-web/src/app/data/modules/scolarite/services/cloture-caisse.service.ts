import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ClotureCaisseService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.SCOLARITE}/secretariat/cloturesCaisse`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<any> {
    return this.httpClient.get<any>(`${this.SERVICE_URL}/`);
  }

  ouvrir(): Observable<any> {
    return this.httpClient.post<any>(`${this.SERVICE_URL}/ouvrir`, {});
  }

  cloturer(id: string, montantReel: number): Observable<any> {
    return this.httpClient.put<any>(`${this.SERVICE_URL}/${id}/cloturer`, { montantReel });
  }

  getJournal(id: string): Observable<any> {
    return this.httpClient.get<any>(`${this.SERVICE_URL}/${id}/journal`);
  }
}
