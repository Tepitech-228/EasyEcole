import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class BourseService {

  private readonly BASE = `${environment.API_MODULES.BOURSE}`;

  constructor(private http: HttpClient) { }

  // ── Configurations ──
  getConfigurations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/configurations`);
  }

  getConfiguration(id: number): Observable<any> {
    return this.http.get<any>(`${this.BASE}/configurations/${id}`);
  }

  createConfiguration(data: any): Observable<any> {
    return this.http.post(`${this.BASE}/configurations`, data);
  }

  updateConfiguration(id: number, data: any): Observable<any> {
    return this.http.put(`${this.BASE}/configurations/${id}`, data);
  }

  toggleStatutConfiguration(id: number): Observable<any> {
    return this.http.patch(`${this.BASE}/configurations/${id}/statut`, {});
  }

  // ── Attributions ──
  getBourseActive(dossierId: number): Observable<any> {
    return this.http.get<any>(`${this.BASE}/etudiants/${dossierId}/bourse`);
  }

  attribuerBourse(dossierId: number, data: any): Observable<any> {
    return this.http.post(`${this.BASE}/etudiants/${dossierId}/bourse`, data);
  }

  modifierAttribution(id: number, data: any): Observable<any> {
    return this.http.put(`${this.BASE}/attributions/${id}`, data);
  }

  suspendreBourse(id: number, motif?: string): Observable<any> {
    return this.http.patch(`${this.BASE}/attributions/${id}/suspendre`, { motif });
  }

  reactiverBourse(id: number): Observable<any> {
    return this.http.patch(`${this.BASE}/attributions/${id}/reactiver`, {});
  }

  getHistorique(dossierId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/etudiants/${dossierId}/bourses/historique`);
  }

  getResumeFinancier(dossierId: number): Observable<any> {
    return this.http.get<any>(`${this.BASE}/etudiants/${dossierId}/frais`);
  }

  // ── Campagne de bourses ──
  getEtudiantsEligibles(params?: { search?: string; estBoursier?: string; sansBourse?: string }): Observable<any> {
    let queryParams: any = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.estBoursier) queryParams.estBoursier = params.estBoursier;
    if (params?.sansBourse) queryParams.sansBourse = params.sansBourse;
    return this.http.get<any>(`${this.BASE}/campagne/eligibles`, { params: queryParams });
  }

  bulkAttribuer(data: {
    configurationId?: number;
    configData?: { nom: string; type: string; taux: number; description?: string };
    dateDebut: string;
    dateFin?: string | null;
    motif?: string | null;
    dossierIds: number[];
  }): Observable<any> {
    return this.http.post<any>(`${this.BASE}/campagne/attribuer`, data);
  }
}
