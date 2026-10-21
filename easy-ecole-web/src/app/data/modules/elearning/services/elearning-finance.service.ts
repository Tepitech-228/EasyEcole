import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ElearningBudget {
  utilisateurId: number;
  anneeAcademique: string;
  montantAlloue: number;
  montantReserve: number;
  montantConsomme: number;
  soldeDisponible: number;
  mouvements: Array<{ id: number; type: string; montant: number; soldeCourant: number; commentaire: string | null; dateMouvement: string }>;
}

export interface ElearningCourse {
  id: number;
  code: string | null;
  titre: string;
  description: string | null;
  nbCredits: number;
  coutTotal: number | null;
  coutUnitaire: number | null;
  statut: string;
  selection?: { statut: string; coutFige: number } | null;
  ue?: { id: number; code: string; intitule: string } | null;
  professeurResponsable?: { id: number; nom: string; prenoms: string } | null;
}

@Injectable({ providedIn: 'root' })
export class ElearningFinanceService {
  private readonly baseUrl = `${environment.API_URL}/elearning`;

  constructor(private http: HttpClient) {}

  getCatalogue(): Observable<ElearningCourse[]> {
    return this.http.get<ElearningCourse[]>(`${this.baseUrl}/cours/catalogue`);
  }

  getBudget(): Observable<ElearningBudget> {
    return this.http.get<ElearningBudget>(`${this.baseUrl}/budget`);
  }

  choisirCours(coursId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/selections`, { coursId });
  }

  getAnnees(): Observable<Array<{ id: number; libelle: string; active: boolean; dateDebut: string; dateFin: string }>> {
    return this.http.get<Array<{ id: number; libelle: string; active: boolean; dateDebut: string; dateFin: string }>>(`${this.baseUrl}/annees`);
  }

  getTarif(): Observable<{ anneeAcademique: string; prixCredit: number; dateEffet: string | null }> {
    return this.http.get<{ anneeAcademique: string; prixCredit: number; dateEffet: string | null }>(`${this.baseUrl}/tarif-credit`);
  }
}
