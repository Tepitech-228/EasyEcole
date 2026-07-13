import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Classe } from '../models/Classe.model';

@Injectable({
  providedIn: 'root'
})
export class ClasseService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/classes`

  constructor(private httpClient: HttpClient) { }

  getAll(niveauEtudeId?: string): Observable<Classe[]> {
    return this.httpClient.get<Classe[]>(niveauEtudeId ? `${this.SERVICE_URL}?niveauEtudeId=${niveauEtudeId}` : `${this.SERVICE_URL}`)
  }

  get(id: string): Observable<Classe> {
    return this.httpClient.get<Classe>(`${this.SERVICE_URL}/${id}`)
  }

  create(classe: Classe): Observable<Classe> {
    return this.httpClient.post<Classe>(`${this.SERVICE_URL}`, classe)
  }

  update(classe: Classe): Observable<Classe> {
    return this.httpClient.put<Classe>(`${this.SERVICE_URL}/${classe.id!}`, classe)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
