import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Diplome } from '../models/Diplome.model';

@Injectable({ providedIn: 'root' })
export class DiplomeService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.SCOLARITE}/diplomes`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<Diplome[]> {
    return this.httpClient.get<Diplome[]>(`${this.SERVICE_URL}/`)
  }

  get(id: string): Observable<Diplome> {
    return this.httpClient.get<Diplome>(`${this.SERVICE_URL}/${id}`)
  }

  create(data: Diplome): Observable<Diplome> {
    return this.httpClient.post<Diplome>(`${this.SERVICE_URL}`, data)
  }

  update(data: Diplome): Observable<Diplome> {
    return this.httpClient.put<Diplome>(`${this.SERVICE_URL}/${data.id!}`, data)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }

  genererNumero(annee: string): Observable<{ numero: string }> {
    return this.httpClient.get<{ numero: string }>(`${this.SERVICE_URL}/genererNumero/${annee}`)
  }

  getByCursus(cursusId: string): Observable<Diplome[]> {
    return this.httpClient.get<Diplome[]>(`${this.SERVICE_URL}/byCursus/${cursusId}`)
  }
}
