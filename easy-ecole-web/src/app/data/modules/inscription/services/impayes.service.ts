import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ImpayesEcheance {
  id: string;
  type: 'inscription' | 'scolarite';
  numeroEcheance: number;
  moisConcerne: string;
  dateLimite: Date;
  montant: number;
  montantPaye: number;
  statut: 'impaye' | 'partiel' | 'en_retard';
}

export interface ImpayesEtudiant {
  id: string;
  nom: string;
  prenoms: string;
  matricule: string;
}

export interface ImpayesClasse {
  id: string;
  libelle: string;
}

export interface ImpayesNiveau {
  id: string;
  libelle: string;
}

export interface ImpayesParcours {
  id: string;
  titre: string;
  type: string;
}

export interface ImpayesAnneeAcademique {
  id: string;
  libelle: string;
}

export interface ImpayesDataItem {
  etudiant: ImpayesEtudiant;
  classe: ImpayesClasse;
  niveau: ImpayesNiveau;
  parcours: ImpayesParcours;
  anneeAcademique: ImpayesAnneeAcademique;
  echeancesNonSoldees: ImpayesEcheance[];
  totalRestant: number;
}

export interface ImpayesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ImpayesResponse {
  data: ImpayesDataItem[];
  pagination: ImpayesPagination;
  semestres: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ImpayesService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/finance/irreguliers`;

  constructor(private httpClient: HttpClient) { }

  getImpayes(params?: any): Observable<ImpayesResponse> {
    return this.httpClient.get<ImpayesResponse>(this.SERVICE_URL, { params });
  }
}
