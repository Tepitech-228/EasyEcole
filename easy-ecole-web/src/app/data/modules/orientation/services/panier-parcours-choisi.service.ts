import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PanierParcoursChoisi } from '../models/PanierParcoursChoisi.model';

@Injectable({
  providedIn: 'root'
})
export class PanierParcoursChoisiService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.ORIENTATION}/panierParcoursChoisis`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<PanierParcoursChoisi[]> {
    return this.httpClient.get<PanierParcoursChoisi[]>(`${this.SERVICE_URL}`)
  }

  create(panierParcoursChoisi: PanierParcoursChoisi): Observable<PanierParcoursChoisi> {
    return this.httpClient.post<PanierParcoursChoisi>(`${this.SERVICE_URL}`, panierParcoursChoisi)
  }
  
  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
  
  deleteAll(): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/`)
  }

  getCount(): Observable<any> {
    return this.httpClient.get(`${this.SERVICE_URL}/statistics/count`)
  }
  
}
