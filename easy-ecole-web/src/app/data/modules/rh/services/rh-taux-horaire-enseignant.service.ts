import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface TauxHoraireEnseignant {
  id: number;
  niveauEtudeId: number;
  coursId: number;
  enseignantId: number | null;
  tauxHoraire: number;
}

@Injectable({ providedIn: 'root' })
export class RhTauxHoraireEnseignantService {
  private readonly url = `${environment.API_MODULES.RH}/taux-horaires-enseignants`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TauxHoraireEnseignant[]> {
    return this.http.get<TauxHoraireEnseignant[]>(this.url);
  }

  getOptions(): Observable<any> {
    return this.http.get<any>(`${this.url}/options`);
  }

  save(taux: Omit<TauxHoraireEnseignant, 'id'>): Observable<TauxHoraireEnseignant> {
    return this.http.post<TauxHoraireEnseignant>(this.url, taux);
  }

  delete(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.url}/${id}`);
  }
}
