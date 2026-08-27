import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SalleDeClasse } from '../models/SalleDeClasse.model';

@Injectable({
  providedIn: 'root'
})
export class SalleDeClasseService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/sallesDeClasse`

  constructor(private httpClient: HttpClient) { }

  getAll(classeId?: string, parcoursId?: string, etablissementId?: string, type?: string, regime?: string, statut?: string, recherche?: string): Observable<SalleDeClasse[]> {
    let params = new HttpParams();
    if (classeId != null && classeId !== '') params = params.set('classeId', classeId);
    if (parcoursId != null && parcoursId !== '') params = params.set('parcoursId', parcoursId);
    if (etablissementId != null && etablissementId !== '') params = params.set('etablissementId', etablissementId);
    if (type != null && type !== '') params = params.set('type', type);
    if (regime != null && regime !== '') params = params.set('regime', regime);
    if (statut != null && statut !== '') params = params.set('statut', statut);
    if (recherche != null && recherche.trim() !== '') params = params.set('recherche', recherche.trim());
    return this.httpClient.get<SalleDeClasse[]>(this.SERVICE_URL, { params })
  }

  get(id: string): Observable<SalleDeClasse> {
    return this.httpClient.get<SalleDeClasse>(`${this.SERVICE_URL}/${id}`)
  }

  create(item: SalleDeClasse): Observable<SalleDeClasse> {
    return this.httpClient.post<SalleDeClasse>(`${this.SERVICE_URL}`, item)
  }

  update(item: SalleDeClasse): Observable<SalleDeClasse> {
    return this.httpClient.put<SalleDeClasse>(`${this.SERVICE_URL}/${item.id!}`, item)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
