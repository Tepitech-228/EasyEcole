import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DemandeAchat, ValidationAchat } from '../models/achats.models';

@Injectable({ providedIn: 'root' })
export class ValidationService {
  private readonly URL = `${environment.API_MODULES.ACHATS}/validations`;

  constructor(private http: HttpClient) {}

  /** Demandes en attente de validation pour le validateur connecté. */
  getValidationsEnAttente(): Observable<DemandeAchat[]> {
    return this.http.get<DemandeAchat[]>(`${this.URL}/en-attente`);
  }

  approuver(demandeId: number | string, commentaire?: string): Observable<ValidationAchat> {
    return this.http.put<ValidationAchat>(`${this.URL}/${demandeId}/approuver`, { commentaire });
  }

  rejeter(demandeId: number | string, commentaire?: string): Observable<ValidationAchat> {
    return this.http.put<ValidationAchat>(`${this.URL}/${demandeId}/rejeter`, { commentaire });
  }
}
