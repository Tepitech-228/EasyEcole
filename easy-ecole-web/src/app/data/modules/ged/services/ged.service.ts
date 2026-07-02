import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface GedDocument {
  id: string;
  titre: string;
  reference?: string;
  eleve?: string;
  parcours?: string;
  categorie?: string;
  tags?: string;
  nommage?: string;
  type?: string;
  statut?: string;
  fichier: string;
  taille?: string;
  date?: string;
  uploaderId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class GedService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.SCOLARITE}`.replace('/scolarite', '/ged/documents');

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<GedDocument[]> {
    return this.httpClient.get<GedDocument[]>(`${this.SERVICE_URL}`);
  }

  upload(formData: FormData): Observable<GedDocument> {
    return this.httpClient.post<GedDocument>(`${this.SERVICE_URL}`, formData);
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`);
  }

  getDownloadUrl(id: string): string {
    return `${this.SERVICE_URL}/download/${id}`;
  }
}
