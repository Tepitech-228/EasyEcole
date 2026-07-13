import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ConseilClasse } from '../models/ConseilClasse.model';

@Injectable({ providedIn: 'root' })
export class ConseilClasseService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.SCOLARITE}/conseils`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<ConseilClasse[]> {
    return this.httpClient.get<ConseilClasse[]>(`${this.SERVICE_URL}/`)
  }

  get(id: string): Observable<ConseilClasse> {
    return this.httpClient.get<ConseilClasse>(`${this.SERVICE_URL}/${id}`)
  }

  create(data: ConseilClasse): Observable<ConseilClasse> {
    return this.httpClient.post<ConseilClasse>(`${this.SERVICE_URL}`, data)
  }

  update(data: ConseilClasse): Observable<ConseilClasse> {
    return this.httpClient.put<ConseilClasse>(`${this.SERVICE_URL}/${data.id!}`, data)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
