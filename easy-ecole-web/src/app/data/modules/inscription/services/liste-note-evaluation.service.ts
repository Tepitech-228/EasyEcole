import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ListeNoteEvaluation } from '../models/ListeNoteEvaluation.model';

@Injectable({
  providedIn: 'root'
})
export class ListeNoteEvaluationService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/listesNoteEvaluation`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<ListeNoteEvaluation[]> {
    return this.httpClient.get<ListeNoteEvaluation[]>(`${this.SERVICE_URL}`)
  }

  get(id: string): Observable<ListeNoteEvaluation> {
    return this.httpClient.get<ListeNoteEvaluation>(`${this.SERVICE_URL}/${id}`)
  }

  create(liste: ListeNoteEvaluation): Observable<ListeNoteEvaluation> {
    return this.httpClient.post<ListeNoteEvaluation>(`${this.SERVICE_URL}`, liste)
  }

  update(liste: ListeNoteEvaluation): Observable<ListeNoteEvaluation> {
    return this.httpClient.put<ListeNoteEvaluation>(`${this.SERVICE_URL}/${liste.id!}`, liste)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
