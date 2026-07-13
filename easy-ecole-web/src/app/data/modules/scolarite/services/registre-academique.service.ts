import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RegistreAcademique } from '../models/RegistreAcademique.model';

@Injectable({ providedIn: 'root' })
export class RegistreAcademiqueService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.SCOLARITE}/registres`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<RegistreAcademique[]> {
    return this.httpClient.get<RegistreAcademique[]>(`${this.SERVICE_URL}/`)
  }

  get(id: string): Observable<RegistreAcademique> {
    return this.httpClient.get<RegistreAcademique>(`${this.SERVICE_URL}/${id}`)
  }

  create(data: RegistreAcademique): Observable<RegistreAcademique> {
    return this.httpClient.post<RegistreAcademique>(`${this.SERVICE_URL}`, data)
  }

  update(data: RegistreAcademique): Observable<RegistreAcademique> {
    return this.httpClient.put<RegistreAcademique>(`${this.SERVICE_URL}/${data.id!}`, data)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
