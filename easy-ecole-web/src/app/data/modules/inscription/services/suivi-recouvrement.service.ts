import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type GranulariteRecouvrement = 'jour' | 'semaine';

export interface SuiviRecouvrementData {
  periode: {
    dateDebut: string;
    dateFin: string;
    granularite: GranulariteRecouvrement;
  };
  totaux: {
    nombreRecouvrements: number;
    montantTotal: number;
    comptesActifs: number;
    moyenneParPeriode: number;
  };
  parCompte: Array<{
    utilisateurId: number;
    nomComplet: string;
    nombreRecouvrements: number;
    montantTotal: number;
  }>;
  evolution: Array<{
    date: string;
    nombreRecouvrements: number;
    comptes: Record<string, number>;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class SuiviRecouvrementService {
  private readonly url = `${environment.API_MODULES.INSCRIPTION}/finance/suivi-recouvrements`;

  constructor(private http: HttpClient) { }

  getSuivi(
    dateDebut: string,
    dateFin: string,
    granularite: GranulariteRecouvrement
  ): Observable<{ success: boolean; data: SuiviRecouvrementData }> {
    const params = new HttpParams()
      .set('dateDebut', dateDebut)
      .set('dateFin', dateFin)
      .set('granularite', granularite);
    return this.http.get<{ success: boolean; data: SuiviRecouvrementData }>(this.url, { params });
  }
}
