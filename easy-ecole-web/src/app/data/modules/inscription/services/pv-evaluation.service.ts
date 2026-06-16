import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PvImportResult {
  success: boolean
  importedCount: number
  errorCount: number
  details: { matricule: string, nom: string, note: number | null, status: string }[]
  errors?: string[]
}

@Injectable({
  providedIn: 'root'
})
export class PvEvaluationService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/listesNoteEvaluation`

  constructor(private httpClient: HttpClient) { }

  exportPv(evaluationId: string): Observable<Blob> {
    return this.httpClient.get(`${this.SERVICE_URL}/${evaluationId}/export-pv`, {
      responseType: 'blob'
    })
  }

  importPv(evaluationId: string, file: File): Observable<PvImportResult> {
    const formData = new FormData()
    formData.append('pv', file)
    return this.httpClient.post<PvImportResult>(`${this.SERVICE_URL}/${evaluationId}/import-pv`, formData)
  }
}
