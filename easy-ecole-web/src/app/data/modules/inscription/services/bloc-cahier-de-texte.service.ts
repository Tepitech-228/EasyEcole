import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BlocCahierDeTexte } from '../models/BlocCahierDeTexte.model';

@Injectable({
  providedIn: 'root'
})
export class BlocCahierDeTexteService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/blocsCahierDeTexte`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<BlocCahierDeTexte[]> {
    return this.httpClient.get<BlocCahierDeTexte[]>(`${this.SERVICE_URL}/`)
  }

  get(id: string): Observable<BlocCahierDeTexte> {
    return this.httpClient.get<BlocCahierDeTexte>(`${this.SERVICE_URL}/${id}`)
  }

  create(blocCahierDeTexte: BlocCahierDeTexte): Observable<BlocCahierDeTexte> {
    return this.httpClient.post<BlocCahierDeTexte>(`${this.SERVICE_URL}`, blocCahierDeTexte)
  }

  update(blocCahierDeTexte: BlocCahierDeTexte): Observable<BlocCahierDeTexte> {
    return this.httpClient.put<BlocCahierDeTexte>(`${this.SERVICE_URL}/${blocCahierDeTexte.id!}`, blocCahierDeTexte)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
