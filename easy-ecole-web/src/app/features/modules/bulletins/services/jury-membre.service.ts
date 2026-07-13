import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class JuryMembreService {
  private apiUrl = `${environment.API_URL}/inscription/jury-membres`;

  constructor(private http: HttpClient) {}

  getAll(params?: any): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { params });
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
}
