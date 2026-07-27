import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Enfant {
  apprenantId: number;
  nom: string;
  prenoms: string;
  photo?: string;
  classe?: string;
  parcours?: string;
  anneeAcademique?: string;
}

export interface DashboardData {
  moyenne: number | null;
  totalAbsences: number;
  absencesNonJustifiees: number;
  prochainCours?: { cours: string; date: string; heure: string; salle: string };
  derniereNote?: { cours: string; note: number; appreciation: string };
  echeances: { libelle: string; montant: number; dateEcheance: string; paye: boolean }[];
}

export interface NoteData {
  id: number;
  bulletinId: number;
  cours: string;
  note: number;
  coefficient: number;
  appreciation: string;
  semestre: string;
}

export interface AbsenceData {
  id: number;
  date: string;
  type: string;
  justifie: boolean;
  motif?: string;
  cours?: string;
}

export interface EdtData {
  jour: string;
  horaire: string;
  cours: string;
  salle: string;
  enseignant: string;
}

export interface PaiementData {
  id: number;
  libelle: string;
  montant: number;
  montantPaye: number;
  dateEcheance: string;
  statut: string;
  mois?: string;
}

export interface DocumentData {
  id: number;
  titre: string;
  type: string;
  date: string;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class ParentService {
  private readonly BASE = `${environment.API_URL}/parent`;

  constructor(private http: HttpClient) {}

  getEnfants(): Observable<Enfant[]> {
    return this.http.get<Enfant[]>(`${this.BASE}/enfants`);
  }

  getDashboard(apprenantId: number): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.BASE}/enfants/${apprenantId}/dashboard`);
  }

  getNotes(apprenantId: number): Observable<NoteData[]> {
    return this.http.get<NoteData[]>(`${this.BASE}/enfants/${apprenantId}/notes`);
  }

  getAbsences(apprenantId: number): Observable<AbsenceData[]> {
    return this.http.get<AbsenceData[]>(`${this.BASE}/enfants/${apprenantId}/absences`);
  }

  getEmploiDuTemps(apprenantId: number): Observable<EdtData[]> {
    return this.http.get<EdtData[]>(`${this.BASE}/enfants/${apprenantId}/emploi-du-temps`);
  }

  getPaiements(apprenantId: number): Observable<PaiementData[]> {
    return this.http.get<PaiementData[]>(`${this.BASE}/enfants/${apprenantId}/paiements`);
  }

  getDocuments(apprenantId: number): Observable<DocumentData[]> {
    return this.http.get<DocumentData[]>(`${this.BASE}/enfants/${apprenantId}/documents`);
  }
}
