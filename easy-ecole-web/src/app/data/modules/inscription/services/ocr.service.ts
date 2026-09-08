import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/**
 * Service d'extraction OCR/ICR pour le wizard d'inscription.
 * Appelle le backend qui pré-remplit les informations personnelles de l'étudiant
 * à partir des pièces déposées. Le moteur est branchable (recommandation :
 * PaddleOCR/Surya on-premise pour garder les données PII dans l'établissement).
 */
@Injectable({
  providedIn: 'root'
})
export class OcrService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/ocr`

  constructor(private httpClient: HttpClient) { }

  /**
   * Pré-remplit les champs d'informations personnelles.
   * @param documents fichiers (pièces justificatives) à analyser
   */
  preRemplissage(documents: File[]): Observable<any> {
    const formData = new FormData()
    for (const doc of documents) {
      if (doc) formData.append('documents', doc, doc.name)
    }
    return this.httpClient.post<any>(`${this.SERVICE_URL}/pre-remplissage`, formData)
  }
}
