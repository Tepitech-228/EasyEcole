import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const EXCEL_BASE = environment.API_MODULES.INSCRIPTION + '/excel';

export interface ExcelImportResult {
  success: boolean;
  importedCount: number;
  errorCount: number;
  details: { email?: string; code?: string; statut: string; message: string; motDePasse?: string }[];
}

@Injectable({
  providedIn: 'root',
})
export class ExcelService {
  constructor(private http: HttpClient) {}

  // ========================================================================
  //  UE (COURS)
  // ========================================================================

  /** Télécharger le template d'import des UE */
  downloadUeTemplate(): Observable<Blob> {
    return this.http.get(`${EXCEL_BASE}/ue/template`, { responseType: 'blob' });
  }

  /** Importer des UE depuis un fichier Excel */
  importUe(file: File): Observable<ExcelImportResult> {
    const formData = new FormData();
    formData.append('fichier', file);
    return this.http.post<ExcelImportResult>(`${EXCEL_BASE}/ue/import`, formData);
  }

  /** Exporter les UE au format Excel */
  exportUe(): Observable<Blob> {
    return this.http.get(`${EXCEL_BASE}/ue/export`, { responseType: 'blob' });
  }

  // ========================================================================
  //  ENSEIGNANTS
  // ========================================================================

  /** Télécharger le template d'import des enseignants */
  downloadEnseignantTemplate(): Observable<Blob> {
    return this.http.get(`${EXCEL_BASE}/enseignants/template`, { responseType: 'blob' });
  }

  /** Importer des enseignants depuis un fichier Excel */
  importEnseignants(file: File): Observable<ExcelImportResult> {
    const formData = new FormData();
    formData.append('fichier', file);
    return this.http.post<ExcelImportResult>(`${EXCEL_BASE}/enseignants/import`, formData);
  }

  /** Exporter les enseignants au format Excel */
  exportEnseignants(): Observable<Blob> {
    return this.http.get(`${EXCEL_BASE}/enseignants/export`, { responseType: 'blob' });
  }

  // ========================================================================
  //  APPRENANTS (ÉTUDIANTS)
  // ========================================================================

  /** Télécharger le template d'import des apprenants */
  downloadApprenantTemplate(): Observable<Blob> {
    return this.http.get(`${EXCEL_BASE}/apprenants/template`, { responseType: 'blob' });
  }

  /** Importer des apprenants depuis un fichier Excel */
  importApprenants(file: File): Observable<ExcelImportResult> {
    const formData = new FormData();
    formData.append('fichier', file);
    return this.http.post<ExcelImportResult>(`${EXCEL_BASE}/apprenants/import`, formData);
  }

  /** Exporter les apprenants au format Excel */
  exportApprenants(): Observable<Blob> {
    return this.http.get(`${EXCEL_BASE}/apprenants/export`, { responseType: 'blob' });
  }

  // ========================================================================
  //  UTILITAIRE
  // ========================================================================

  /** Déclenche le téléchargement d'un Blob dans le navigateur */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
