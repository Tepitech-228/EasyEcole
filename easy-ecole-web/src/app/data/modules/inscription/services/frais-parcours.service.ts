import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FraisParcoursService {
  private readonly SERVICE_URL = `${environment.API_MODULES.INSCRIPTION}/frais-parcours`;

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

  getByParcours(parcoursId: number | string): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.SERVICE_URL}/by-parcours/${parcoursId}`);
  }
}
