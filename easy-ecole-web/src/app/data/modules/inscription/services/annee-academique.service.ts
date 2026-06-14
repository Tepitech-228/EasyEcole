import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AnneeAcademique } from '../models/AnneeAcademique.model';

@Injectable({
  providedIn: 'root'
})
export class AnneeAcademiqueService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/anneesAcademiques`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<AnneeAcademique[]> {
    return this.httpClient.get<AnneeAcademique[]>(`${this.SERVICE_URL}`)
  }

  get(id: string): Observable<AnneeAcademique> {
    return this.httpClient.get<AnneeAcademique>(`${this.SERVICE_URL}/${id}`)
  }

  create(anneeAcademique: AnneeAcademique): Observable<AnneeAcademique> {
    return this.httpClient.post<AnneeAcademique>(`${this.SERVICE_URL}`, anneeAcademique)
  }

  update(anneeAcademique: AnneeAcademique): Observable<AnneeAcademique> {
    return this.httpClient.put<AnneeAcademique>(`${this.SERVICE_URL}/${anneeAcademique.id!}`, anneeAcademique)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
