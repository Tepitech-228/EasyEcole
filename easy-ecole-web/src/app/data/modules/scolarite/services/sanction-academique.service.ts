import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SanctionAcademique } from '../models/SanctionAcademique.model';

@Injectable({ providedIn: 'root' })
export class SanctionAcademiqueService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.SCOLARITE}/sanctions`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<SanctionAcademique[]> {
    return this.httpClient.get<SanctionAcademique[]>(`${this.SERVICE_URL}/`)
  }

  get(id: string): Observable<SanctionAcademique> {
    return this.httpClient.get<SanctionAcademique>(`${this.SERVICE_URL}/${id}`)
  }

  create(data: SanctionAcademique): Observable<SanctionAcademique> {
    return this.httpClient.post<SanctionAcademique>(`${this.SERVICE_URL}`, data)
  }

  update(data: SanctionAcademique): Observable<SanctionAcademique> {
    return this.httpClient.put<SanctionAcademique>(`${this.SERVICE_URL}/${data.id!}`, data)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }

  getByCursus(cursusId: string): Observable<SanctionAcademique[]> {
    return this.httpClient.get<SanctionAcademique[]>(`${this.SERVICE_URL}/byCursus/${cursusId}`)
  }

  getActives(): Observable<SanctionAcademique[]> {
    return this.httpClient.get<SanctionAcademique[]>(`${this.SERVICE_URL}/actives`)
  }
}
