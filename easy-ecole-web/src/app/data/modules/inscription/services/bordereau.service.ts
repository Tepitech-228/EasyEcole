import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Bordereau } from '../models/Bordereau.model';

@Injectable({
  providedIn: 'root'
})
export class BordereauService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/bordereaux`

  constructor(private httpClient: HttpClient) { }

  getAll(params?: any): Observable<Bordereau[]> {
    return this.httpClient.get<Bordereau[]>(`${this.SERVICE_URL}`, { params })
  }

  get(id: string): Observable<Bordereau> {
    return this.httpClient.get<Bordereau>(`${this.SERVICE_URL}/${id}`)
  }

  upload(formData: FormData): Observable<Bordereau> {
    return this.httpClient.post<Bordereau>(`${this.SERVICE_URL}`, formData)
  }

  valider(id: string, commentaire?: string): Observable<Bordereau> {
    return this.httpClient.put<Bordereau>(`${this.SERVICE_URL}/${id}/valider`, { commentaire })
  }

  rejeter(id: string, commentaire: string): Observable<Bordereau> {
    return this.httpClient.put<Bordereau>(`${this.SERVICE_URL}/${id}/rejeter`, { commentaire })
  }
}
