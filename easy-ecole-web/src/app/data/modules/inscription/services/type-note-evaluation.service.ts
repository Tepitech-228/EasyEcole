import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TypeNoteEvaluation } from '../models/TypeNoteEvaluation.model';

@Injectable({
  providedIn: 'root'
})
export class TypeNoteEvaluationService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/typesNoteEvaluation`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<TypeNoteEvaluation[]> {
    return this.httpClient.get<TypeNoteEvaluation[]>(`${this.SERVICE_URL}`)
  }

  get(id: string): Observable<TypeNoteEvaluation> {
    return this.httpClient.get<TypeNoteEvaluation>(`${this.SERVICE_URL}/${id}`)
  }
}
