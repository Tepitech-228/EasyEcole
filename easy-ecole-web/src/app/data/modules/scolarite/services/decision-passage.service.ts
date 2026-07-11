import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DecisionPassage } from '../models/DecisionPassage.model';

@Injectable({ providedIn: 'root' })
export class DecisionPassageService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.SCOLARITE}/decisions-passage`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<DecisionPassage[]> {
    return this.httpClient.get<DecisionPassage[]>(`${this.SERVICE_URL}/`)
  }

  get(id: string): Observable<DecisionPassage> {
    return this.httpClient.get<DecisionPassage>(`${this.SERVICE_URL}/${id}`)
  }

  create(data: DecisionPassage): Observable<DecisionPassage> {
    return this.httpClient.post<DecisionPassage>(`${this.SERVICE_URL}`, data)
  }

  update(data: DecisionPassage): Observable<DecisionPassage> {
    return this.httpClient.put<DecisionPassage>(`${this.SERVICE_URL}/${data.id!}`, data)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }

  getByCursus(cursusId: string): Observable<DecisionPassage[]> {
    return this.httpClient.get<DecisionPassage[]>(`${this.SERVICE_URL}/byCursus/${cursusId}`)
  }

  getByAnnee(anneeId: string): Observable<DecisionPassage[]> {
    return this.httpClient.get<DecisionPassage[]>(`${this.SERVICE_URL}/byAnnee/${anneeId}`)
  }
}
