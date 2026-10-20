import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface StoredFile {
  id: number;
  originType: 'import' | 'legacy';
  titre: string;
  nomFichier: string;
  mimeType: string;
  taille: number;
  categorie: 'academique' | 'financier' | 'administratif' | 'autre';
  anneeAcademiqueId: number | null;
  etablissementId: number | null;
  filiereId: number | null;
  filiere: string | null;
  niveauEtudeId: number | null;
  parcoursId: number | null;
  classeId: number | null;
  date: string;
  status: 'present' | 'missing';
  integrityHash: string | null;
}

export interface StoredFileChoice {
  id: number;
  label: string;
}

export interface StoredFileOptions {
  sites: StoredFileChoice[];
  annees: StoredFileChoice[];
  niveaux: StoredFileChoice[];
  parcours: StoredFileChoice[];
  classes: StoredFileChoice[];
}

export interface StoredFileFilters {
  q?: string;
  categorie?: string;
  anneeAcademiqueId?: string | number;
  etablissementId?: string | number;
  filiere?: string;
  niveauEtudeId?: string | number;
  parcoursId?: string | number;
  classeId?: string | number;
}

@Injectable({ providedIn: 'root' })
export class StoredFilesService {
  private readonly url = `${environment.API_MODULES.GED}/files`;

  constructor(private http: HttpClient) {}

  getOptions(): Observable<StoredFileOptions> {
    return this.http.get<StoredFileOptions>(`${this.url}/options`);
  }

  list(filters: StoredFileFilters, page: number): Observable<{ total: number; page: number; pageSize: number; files: StoredFile[] }> {
    let params = new HttpParams().set('page', String(page)).set('pageSize', '25');
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<{ total: number; page: number; pageSize: number; files: StoredFile[] }>(this.url, { params });
  }

  upload(data: FormData): Observable<StoredFile> {
    return this.http.post<StoredFile>(this.url, data);
  }

  content(id: number): Observable<Blob> {
    return this.http.get(`${this.url}/${id}/content`, { responseType: 'blob' });
  }

  verify(id: number): Observable<{ valid: boolean; baselineCreated: boolean; message?: string; sha256?: string }> {
    return this.http.get<{ valid: boolean; baselineCreated: boolean; message?: string; sha256?: string }>(`${this.url}/${id}/verify`);
  }

  exportCsv(filters: StoredFileFilters): Observable<Blob> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get(`${this.url}/export`, { params, responseType: 'blob' });
  }
}
