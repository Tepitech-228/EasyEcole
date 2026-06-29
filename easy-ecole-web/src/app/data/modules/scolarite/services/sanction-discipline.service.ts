import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SanctionDiscipline } from '../models/SanctionDiscipline.model';

@Injectable({ providedIn: 'root' })
export class SanctionDisciplineService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.SCOLARITE}/discipline`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<SanctionDiscipline[]> {
    return this.httpClient.get<SanctionDiscipline[]>(`${this.SERVICE_URL}/`)
  }

  get(id: string): Observable<SanctionDiscipline> {
    return this.httpClient.get<SanctionDiscipline>(`${this.SERVICE_URL}/${id}`)
  }

  create(data: SanctionDiscipline): Observable<SanctionDiscipline> {
    return this.httpClient.post<SanctionDiscipline>(`${this.SERVICE_URL}`, data)
  }

  update(data: SanctionDiscipline): Observable<SanctionDiscipline> {
    return this.httpClient.put<SanctionDiscipline>(`${this.SERVICE_URL}/${data.id!}`, data)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
