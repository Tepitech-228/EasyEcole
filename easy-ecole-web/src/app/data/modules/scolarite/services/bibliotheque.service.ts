import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Livre {
  id: string
  titre: string
  auteur: string
  description?: string
  fichier: string
  taille?: string
  consultations?: number
  uploaderId?: string
  createdAt?: Date
  updatedAt?: Date
}

@Injectable({
  providedIn: 'root'
})
export class BibliothequeService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}`.replace('/inscription', '/scolarite/bibliotheque')

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<Livre[]> {
    return this.httpClient.get<Livre[]>(`${this.SERVICE_URL}`)
  }

  get(id: string): Observable<Livre> {
    return this.httpClient.get<Livre>(`${this.SERVICE_URL}/${id}`)
  }

  upload(formData: FormData): Observable<Livre> {
    return this.httpClient.post<Livre>(`${this.SERVICE_URL}`, formData)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }

  consulter(id: string): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/${id}/consulter`, {})
  }

  getDownloadUrl(id: string): string {
    return `${this.SERVICE_URL}/download/${id}`
  }
}
