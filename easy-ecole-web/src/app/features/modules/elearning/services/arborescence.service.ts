import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

/* ═══════════════════════════════════════════════════════════════════════════
 * Contrat API exporté par le backend (ArborescenceElearningService.ts) —
 * miroir strict du payload de GET /api/v1/elearning/arborescence.
 *
 * Hiérarchie réelle (6 niveaux, pas de Filière séparée — le Parcours joue
 * ce rôle) : Année → Parcours → Niveau → Classe → Cours → CoursEnLigne.
 * Nœuds virtuels : ClasseArbre.estVirtuel (rubrique « Sans classe ») et la
 * liste `nonRattaches` (cours en ligne sans rattachement, réservée à l'admin).
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface CoursEnLigneArbre {
  id: number | string;
  coursId: string | null;
  titre: string;
  description: string | null;
  statut: string;
  format: string | null;
  enseignantId: number | null;
}

export interface CoursArbre {
  id: number;
  code: string;
  intitule: string;
  classeId: number | null;
  compteurCoursEnLigne: number;
  coursEnLigne: CoursEnLigneArbre[];
}

export interface ClasseArbre {
  id: number | null;
  libelle: string;
  estVirtuel?: boolean;
  compteurCoursEnLigne: number;
  cours: CoursArbre[];
}

export interface NiveauArbre {
  id: number | null;
  libelle: string;
  compteurCoursEnLigne: number;
  classes: ClasseArbre[];
}

export interface ParcoursArbre {
  id: number;
  titre: string;
  description: string | null;
  compteurCoursEnLigne: number;
  niveaux: NiveauArbre[];
}

export interface AnneeAcademiqueArbre {
  id: number;
  libelle: string;
  compteurCoursEnLigne: number;
  parcours: ParcoursArbre[];
}

export interface TotauxArborescence {
  annees: number;
  parcours: number;
  niveaux: number;
  classes: number;
  cours: number;
  coursEnLigne: number;
  coursEnLigneRattaches: number;
  coursEnLigneNonRattaches: number;
}

export interface ArborescenceElearningResponse {
  annees: AnneeAcademiqueArbre[];
  nonRattaches: CoursEnLigneArbre[];
  totaux: TotauxArborescence;
}

@Injectable({ providedIn: 'root' })
export class ArborescenceService {
  private apiUrl = `${environment.API_URL}/elearning/arborescence`;

  constructor(private http: HttpClient) {}

  getArborescence(): Observable<ArborescenceElearningResponse> {
    return this.http.get<ArborescenceElearningResponse>(this.apiUrl);
  }
}
