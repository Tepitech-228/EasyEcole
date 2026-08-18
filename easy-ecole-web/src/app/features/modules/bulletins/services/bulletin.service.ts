import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BulletinService {
  private apiUrl = `${environment.API_URL}/inscription/bulletins`;

  constructor(private http: HttpClient) {}

  getAll(params?: any): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params });
  }

  getOne(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Génère (ou régénère) les bulletins d'une classe.
   * @param semestre     clé du semestre ('semestre1'...) ou null/'' pour tous les semestres
   * @param salleId      optionnel : restreint la génération aux étudiants d'une salle
   */
  generer(classeId: number, semestre: string | null, anneeAcademiqueId: number, salleId?: string | null): Observable<any[]> {
    const body: Record<string, unknown> = { classeId, anneeAcademiqueId };
    if (semestre) body.semestre = semestre;
    if (salleId) body.salleId = salleId;
    return this.http.post<any[]>(`${this.apiUrl}/generer`, body);
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  publier(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/publier`, {});
  }

  monReleve(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/mon-releve`);
  }

  getMoyennes(params?: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/moyennes`, { params });
  }

  signerEnseignant(id: number, signature: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/signer-enseignant`, { signature });
  }

  signerChef(id: number, signature: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/signer-chef`, { signature });
  }
}
