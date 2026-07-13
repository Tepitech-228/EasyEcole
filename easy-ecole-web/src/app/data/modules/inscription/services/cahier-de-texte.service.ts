import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CahierDeTexte } from '../models/CahierDeTexte.model';

@Injectable({
  providedIn: 'root'
})
export class CahierDeTexteService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/cahiersDeTexte`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<CahierDeTexte[]> {
    return this.httpClient.get<CahierDeTexte[]>(`${this.SERVICE_URL}`)
  }

  get(id: string): Observable<CahierDeTexte> {
    return this.httpClient.get<CahierDeTexte>(`${this.SERVICE_URL}/${id}`)
  }

  create(cahierDeTexte: CahierDeTexte): Observable<CahierDeTexte> {
    return this.httpClient.post<CahierDeTexte>(`${this.SERVICE_URL}`, cahierDeTexte)
  }

  update(cahierDeTexte: CahierDeTexte): Observable<CahierDeTexte> {
    return this.httpClient.put<CahierDeTexte>(`${this.SERVICE_URL}/${cahierDeTexte.id!}`, cahierDeTexte)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
