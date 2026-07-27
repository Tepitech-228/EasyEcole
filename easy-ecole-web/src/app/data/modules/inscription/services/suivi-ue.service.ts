import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface UeStats {
  coursId: number
  code: string
  libelle: string
  creditEcts: number
  semestre: string
  statut: 'validee' | 'dette_active' | 'resorbee' | 'echeance' | 'en_cours' | 'non_entamee'
  moyenne: number | null
  anneeOrigine?: string
  anneeValidation?: string
  detteId?: number
  nbTentatives?: number
  bulletinId?: number
}

export interface AnneeParcoursInfo {
  annee: string
  libelle: string
  semestres: string[]
  ordre: number
}

export interface SemestreProgression {
  semestre: string
  libelle: string
  totalEcts: number
  ectsValides: number
  ectsEnDette: number
  statut: 'non_entame' | 'en_cours' | 'termine' | 'bloque'
  ueCount: number
  ueValidees: number
}

export interface ProgressionSemestrielle {
  anneeActuelle: string
  semestreEnCours: string | null
  annees: AnneeParcoursInfo[]
  semestres: SemestreProgression[]
}

export interface SuiviUeResult {
  cursusApprenantId: number
  parcours: string
  anneeActuelle: string
  ues: UeStats[]
  stats: {
    totalEcts: number
    ectsValides: number
    ectsEnDette: number
    ectsRestants: number
    tauxValidation: number
  }
  progression: ProgressionSemestrielle | null
}

@Injectable({
  providedIn: 'root'
})
export class SuiviUeService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/cursus-apprenant`

  constructor(private httpClient: HttpClient) { }

  getSuivi(cursusId: number): Observable<SuiviUeResult> {
    return this.httpClient.get<SuiviUeResult>(`${this.SERVICE_URL}/${cursusId}/suivi-ue`)
  }

  getMonSuivi(): Observable<SuiviUeResult> {
    return this.httpClient.get<SuiviUeResult>(`${this.SERVICE_URL}/mon-suivi`)
  }

  getDettes(cursusId: number): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.SERVICE_URL}/${cursusId}/dettes`)
  }

  getDettesActives(cursusId: number): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.SERVICE_URL}/${cursusId}/dettes-actives`)
  }

  verifierEligibilite(cursusId: number): Observable<{ eligible: boolean; dettesActives: any[]; message: string }> {
    return this.httpClient.get<{ eligible: boolean; dettesActives: any[]; message: string }>(`${this.SERVICE_URL}/${cursusId}/eligibilite-passation`)
  }
}
