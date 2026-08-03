import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RhEvaluationCritere } from '../models/RhEvaluationCritere.model';

@Injectable({
  providedIn: 'root'
})
export class RhEvaluationCritereService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.RH}/evaluations-criteres`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<RhEvaluationCritere[]> {
    return this.httpClient.get<RhEvaluationCritere[]>(this.SERVICE_URL);
  }

  get(id: string): Observable<RhEvaluationCritere> {
    return this.httpClient.get<RhEvaluationCritere>(`${this.SERVICE_URL}/${id}`);
  }

  create(item: RhEvaluationCritere): Observable<RhEvaluationCritere> {
    return this.httpClient.post<RhEvaluationCritere>(this.SERVICE_URL, item);
  }

  update(item: RhEvaluationCritere): Observable<RhEvaluationCritere> {
    return this.httpClient.put<RhEvaluationCritere>(`${this.SERVICE_URL}/${item.id!}`, item);
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`);
  }
}