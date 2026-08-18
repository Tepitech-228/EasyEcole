import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Reception } from '../models/achats.models';

@Injectable({ providedIn: 'root' })
export class ReceptionService {
  private readonly URL = `${environment.API_MODULES.ACHATS}/receptions`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Reception[]> {
    return this.http.get<Reception[]>(this.URL);
  }

  get(id: number | string): Observable<Reception> {
    return this.http.get<Reception>(`${this.URL}/${id}`);
  }

  create(data: Partial<Reception>): Observable<Reception> {
    return this.http.post<Reception>(this.URL, data);
  }

  delete(id: number | string): Observable<any> {
    return this.http.delete(`${this.URL}/${id}`);
  }
}
