import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RhCritereEvaluation } from '../models/RhCritereEvaluation.model';

@Injectable({
  providedIn: 'root'
})
export class RhCritereEvaluationService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.RH}/criteres-evaluation`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<RhCritereEvaluation[]> {
    return this.httpClient.get<RhCritereEvaluation[]>(this.SERVICE_URL);
  }

  get(id: string): Observable<RhCritereEvaluation> {
    return this.httpClient.get<RhCritereEvaluation>(`${this.SERVICE_URL}/${id}`);
  }

  create(item: RhCritereEvaluation): Observable<RhCritereEvaluation> {
    return this.httpClient.post<RhCritereEvaluation>(this.SERVICE_URL, item);
  }

  update(item: RhCritereEvaluation): Observable<RhCritereEvaluation> {
    return this.httpClient.put<RhCritereEvaluation>(`${this.SERVICE_URL}/${item.id!}`, item);
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`);
  }
}