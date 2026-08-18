import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface LigneFraisEtudiant {
  id: number;
  dossierEtudiantId: number;
  type: 'inscription' | 'scolarite' | 'bibliotheque' | 'assurance' | 'logement' | 'document' | 'penalite';
  montant: number;
  reductionId?: number | null;
  paye: boolean;
  solde: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

@Injectable({ providedIn: 'root' })
export class LigneFraisEtudiantService {
  private readonly URL = `${environment.API_MODULES.COMPTABILITE}/lignes-frais`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<LigneFraisEtudiant[]> {
    return this.http.get<LigneFraisEtudiant[]>(this.URL);
  }

  getByDossier(dossierEtudiantId: number | string): Observable<LigneFraisEtudiant[]> {
    return this.http.get<LigneFraisEtudiant[]>(`${this.URL}/by-dossier/${dossierEtudiantId}`);
  }

  get(id: number | string): Observable<LigneFraisEtudiant> {
    return this.http.get<LigneFraisEtudiant>(`${this.URL}/${id}`);
  }

  create(data: Partial<LigneFraisEtudiant>): Observable<LigneFraisEtudiant> {
    return this.http.post<LigneFraisEtudiant>(this.URL, data);
  }

  update(id: number | string, data: Partial<LigneFraisEtudiant>): Observable<LigneFraisEtudiant> {
    return this.http.put<LigneFraisEtudiant>(`${this.URL}/${id}`, data);
  }

  delete(id: number | string): Observable<any> {
    return this.http.delete(`${this.URL}/${id}`);
  }
}
