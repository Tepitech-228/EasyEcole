import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RhFicheEvaluation } from '../models/RhFicheEvaluation.model';

@Injectable({
  providedIn: 'root'
})
export class RhFicheEvaluationService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.RH}/fiches-evaluation`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<RhFicheEvaluation[]> {
    return this.httpClient.get<RhFicheEvaluation[]>(this.SERVICE_URL);
  }

  get(id: string): Observable<RhFicheEvaluation> {
    return this.httpClient.get<RhFicheEvaluation>(`${this.SERVICE_URL}/${id}`);
  }

  create(item: RhFicheEvaluation): Observable<RhFicheEvaluation> {
    return this.httpClient.post<RhFicheEvaluation>(this.SERVICE_URL, item);
  }

  update(item: RhFicheEvaluation): Observable<RhFicheEvaluation> {
    return this.httpClient.put<RhFicheEvaluation>(`${this.SERVICE_URL}/${item.id!}`, item);
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`);
  }
}