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
  folderId?: number;
  uploaderId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GedSession {
  id: string;
  nom: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  folderId?: number;
  categorie?: string;
  status?: string;
  fields?: string[];
  participantIds?: Array<string | number>;
  creator?: { id: string; nom: string; prenoms: string };
  documents?: GedDocument[];
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class GedService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.SCOLARITE}`.replace('/scolarite', '/ged/documents');
  private readonly SESSION_URL: string = `${environment.API_MODULES.SCOLARITE}`.replace('/scolarite', '/ged/sessions');

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<GedDocument[]> {
    return this.httpClient.get<GedDocument[]>(`${this.SERVICE_URL}`);
  }

  getFolders(): Observable<any[]> {
    const url = `${environment.API_MODULES.SCOLARITE}`.replace('/scolarite', '/ged/folders');
    return this.httpClient.get<any[]>(url);
  }

  createFolder(payload: { nom: string, description?: string }): Observable<any> {
    const url = `${environment.API_MODULES.SCOLARITE}`.replace('/scolarite', '/ged/folders');
    return this.httpClient.post<any>(url, payload);
  }

  deleteFolder(id: string): Observable<any> {
    const url = `${environment.API_MODULES.SCOLARITE}`.replace('/scolarite', '/ged/folders');
    return this.httpClient.delete<any>(`${url}/${id}`);
  }

  upload(formData: FormData): Observable<GedDocument> {
    return this.httpClient.post<GedDocument>(`${this.SERVICE_URL}`, formData);
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`);
  }

  generatePdf(id: string): Observable<Blob> {
    return this.httpClient.get(`${this.SERVICE_URL}/${id}/pdf`, { responseType: 'blob' as 'json' }) as Observable<Blob>;
  }

  getDownloadUrl(id: string): string {
    return `${this.SERVICE_URL}/download/${id}`;
  }

  getSessions(): Observable<GedSession[]> {
    return this.httpClient.get<GedSession[]>(this.SESSION_URL);
  }

  getSession(id: string): Observable<GedSession> {
    return this.httpClient.get<GedSession>(`${this.SESSION_URL}/${id}`);
  }

  createSession(payload: any): Observable<GedSession> {
    return this.httpClient.post<GedSession>(this.SESSION_URL, payload);
  }

  updateSession(id: string, payload: any): Observable<GedSession> {
    return this.httpClient.put<GedSession>(`${this.SESSION_URL}/${id}`, payload);
  }

  batchUpload(sessionId: string, files: File[], metadata: Record<string, string>, folderId?: number, archivedUntil?: string, isArchived = false): Observable<GedDocument[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('fichiers', file, file.name));
    formData.append('sessionId', sessionId);
    if (folderId) {
      formData.append('folderId', String(folderId));
    }
    if (archivedUntil) {
      formData.append('archivedUntil', archivedUntil);
    }
    formData.append('isArchived', String(isArchived));
    formData.append('metadata', JSON.stringify(metadata || {}));
    return this.httpClient.post<GedDocument[]>(`${this.SESSION_URL}/batch-upload`, formData);
  }
}
