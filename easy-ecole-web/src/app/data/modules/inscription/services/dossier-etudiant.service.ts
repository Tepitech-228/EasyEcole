import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DossierEtudiant } from '../models/DossierEtudiant.model';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';

/** Nœud de l'arborescence : un dossier étudiant rattaché à une classe (éventuellement une salle). */
export interface DossierArbreDossier {
  id: number | string;
  utilisateurId?: string;
  matricule?: string;
  nom?: string;
  prenoms?: string;
  statut?: string;
  photo?: string;
  dateCreation?: string | Date;
}

/** Niveau : classe avec ses salles (si rattachées) et ses dossiers. */
export interface DossierArbreClasse {
  classeId?: string;
  classe: string;
  salles?: string[];
  dossiers: DossierArbreDossier[];
}

export interface DossierArbreNiveau {
  niveauId?: string;
  niveau: string;
  classes: DossierArbreClasse[];
}

export interface DossierArbreFiliere {
  parcoursId?: string;
  filiere: string;
  niveaux: DossierArbreNiveau[];
}

export interface DossierArbreAnnee {
  anneeId?: string;
  annee: string;
  filieres: DossierArbreFiliere[];
}

@Injectable({
  providedIn: 'root'
})
export class DossierEtudiantService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/dossiers`

  constructor(private httpClient: HttpClient, private localStorage: LocalStorageService) { }

  getAll(params?: any): Observable<DossierEtudiant[]> {
    return this.httpClient.get<DossierEtudiant[]>(`${this.SERVICE_URL}`, { params })
  }

  getAllPaginated(params?: any): Observable<{ data: DossierEtudiant[], pagination: { page: number, limit: number, total: number, totalPages: number } }> {
    return this.httpClient.get<{ data: DossierEtudiant[], pagination: { page: number, limit: number, total: number, totalPages: number } }>(`${this.SERVICE_URL}`, { params })
  }

  get(id: string): Observable<DossierEtudiant> {
    return this.httpClient.get<DossierEtudiant>(`${this.SERVICE_URL}/${id}`)
  }

  getMonDossier(): Observable<DossierEtudiant> {
    return this.httpClient.get<DossierEtudiant>(`${this.SERVICE_URL}/mon-dossier`)
  }

  generer(dossier: any): Observable<DossierEtudiant> {
    return this.httpClient.post<DossierEtudiant>(`${this.SERVICE_URL}/generer`, dossier)
  }

  getComplet(id: string): Observable<any> {
    return this.httpClient.get(`${this.SERVICE_URL}/${id}/complet`)
  }

  /** Charge l'arborescence complète des dossiers : Année → Filière → Niveau → Classe → (Salles) → Étudiants. */
  getArbre(): Observable<DossierArbreAnnee[]> {
    return this.httpClient.get<DossierArbreAnnee[]>(`${this.SERVICE_URL}/arbre`)
  }

  getStatut(matricule: string): Observable<any> {
    return this.httpClient.get(`${this.SERVICE_URL}/${matricule}/statut`)
  }

  update(id: string, data: any): Observable<DossierEtudiant> {
    return this.httpClient.put<DossierEtudiant>(`${this.SERVICE_URL}/${id}`, data)
  }

  telechargerCarteUrl(id: string): string {
    const token = this.localStorage.get(LocalStorageService.AUTH_TOKEN)
    let url = `${this.SERVICE_URL}/${id}/carte`
    if (token) url += `?token=${encodeURIComponent(token)}`
    return url
  }

  regenererCarte(id: string): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/${id}/regenerer-carte`, {})
  }
}
