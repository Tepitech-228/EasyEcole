import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Budget } from '../models/achats.models';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly URL = `${environment.API_MODULES.ACHATS}/budgets`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Budget[]> {
    return this.http.get<Budget[]>(this.URL);
  }

  get(id: number | string): Observable<Budget> {
    return this.http.get<Budget>(`${this.URL}/${id}`);
  }

  create(data: Partial<Budget>): Observable<Budget> {
    return this.http.post<Budget>(this.URL, data);
  }

  update(id: number | string, data: Partial<Budget>): Observable<Budget> {
    return this.http.put<Budget>(`${this.URL}/${id}`, data);
  }

  delete(id: number | string): Observable<any> {
    return this.http.delete(`${this.URL}/${id}`);
  }
}
