import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportingService {
  private readonly BASE = `${environment.API_URL}/reporting`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<any> {
    return this.http.get(`${this.BASE}/consolide/dashboard`);
  }

  getEffectifs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/effectifs`);
  }

  getEffectifsSummary(): Observable<any> {
    return this.http.get(`${this.BASE}/effectifs/summary`);
  }

  getNotesMoyennes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/notes/moyennes`);
  }

  getNotesReussite(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/notes/reussite`);
  }

  getPaiements(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/paiements`);
  }

  getPaiementsFactures(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/paiements/factures`);
  }

  getPaiementsTotaux(): Observable<any> {
    return this.http.get(`${this.BASE}/paiements/totaux`);
  }

  getBudget(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/budget`);
  }

  getBudgetEcart(): Observable<any> {
    return this.http.get(`${this.BASE}/budget/ecart`);
  }

  getRhEffectifs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/rh/effectifs`);
  }

  getRhPaie(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/rh/paie`);
  }

  getStocks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/achats/stocks`);
  }

  getImmobilisations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/achats/immobilisations`);
  }

  getAchats(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/achats`);
  }
}
