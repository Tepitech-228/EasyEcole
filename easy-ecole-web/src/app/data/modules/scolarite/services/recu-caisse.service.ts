import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class RecuCaisseService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.SCOLARITE}/secretariat/recusCaisse`
  private readonly DOCUMENT_PAYMENT_URL: string = `${this.SERVICE_URL}/demandes-documents`

  constructor(private httpClient: HttpClient) { }

  getAll(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, String(params[key]));
        }
      });
    }
    return this.httpClient.get<any>(`${this.SERVICE_URL}/`, { params: httpParams });
  }

  get(id: string): Observable<any> {
    return this.httpClient.get<any>(`${this.SERVICE_URL}/${id}`);
  }

  print(id: string): Observable<any> {
    return this.httpClient.get(`${this.SERVICE_URL}/${id}/print`, { responseType: 'text' });
  }

  /** Télécharge le PDF du reçu de caisse */
  download(id: string): Observable<Blob> {
    return this.httpClient.get(`${this.SERVICE_URL}/${id}/download`, { responseType: 'blob' });
  }

  rechercherEtudiants(search: string): Observable<{ data: Array<{ id: number; nom: string; prenoms: string; matricule: string }> }> {
    const params = new HttpParams().set('search', search);
    return this.httpClient.get<{ data: Array<{ id: number; nom: string; prenoms: string; matricule: string }> }>(
      `${this.DOCUMENT_PAYMENT_URL}/etudiants`, { params }
    );
  }

  getTypesDocumentsEncaissement(): Observable<Array<{ id: number; libelle: string; frais: number }>> {
    return this.httpClient.get<Array<{ id: number; libelle: string; frais: number }>>(
      `${this.DOCUMENT_PAYMENT_URL}/types`
    );
  }

  encaisserPaiementDocument(data: {
    etudiantId: number;
    typeDocumentId: number;
    modePaiement: string;
    referencePaiement?: string;
  }): Observable<any> {
    return this.httpClient.post<any>(`${this.DOCUMENT_PAYMENT_URL}/encaisser`, data);
  }

  downloadRecuDocument(id: number | string): Observable<Blob> {
    return this.httpClient.get(`${this.DOCUMENT_PAYMENT_URL}/${id}/download`, { responseType: 'blob' });
  }

  getFileImpression(etat: 'a_imprimer' | 'imprimes', page = 1): Observable<{ data: any[]; pagination: any }> {
    const params = new HttpParams().set('etat', etat).set('limit', '100').set('page', String(page));
    return this.httpClient.get<{ data: any[]; pagination: any }>(
      `${environment.API_MODULES.SCOLARITE}/secretariat/demandesDocument/file-impression`, { params }
    );
  }

  getJournalCaisse(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, String(params[key]));
        }
      });
    }
    return this.httpClient.get<any>(`${environment.API_MODULES.SCOLARITE}/secretariat/journalCaisse`, { params: httpParams });
  }
}
