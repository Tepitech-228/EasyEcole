import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RhContratEnseignantService {
  private readonly SERVICE_URL = `${environment.API_MODULES.RH}/contrats-enseignant`;

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<any[]> {
    return this.httpClient.get<any[]>(this.SERVICE_URL);
  }

  get(id: number | string): Observable<any> {
    return this.httpClient.get<any>(`${this.SERVICE_URL}/${id}`);
  }

  create(data: any): Observable<any> {
    return this.httpClient.post<any>(this.SERVICE_URL, data);
  }

  update(id: number | string, data: any): Observable<any> {
    return this.httpClient.put<any>(`${this.SERVICE_URL}/${id}`, data);
  }

  delete(id: number | string): Observable<any> {
    return this.httpClient.delete<any>(`${this.SERVICE_URL}/${id}`);
  }

  getByEmploye(employeId: number | string): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.SERVICE_URL}/by-employe/${employeId}`);
  }

  resilier(id: number | string): Observable<any> {
    return this.httpClient.patch<any>(`${this.SERVICE_URL}/${id}/resilier`, {});
  }

  activer(id: number | string): Observable<any> {
    return this.httpClient.patch<any>(`${this.SERVICE_URL}/${id}/activer`, {});
  }
}
