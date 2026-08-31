import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Parcours } from '../models/Parcours.model';

@Injectable({
  providedIn: 'root'
})
export class ParcoursService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/parcours`

  private cached$: Observable<Parcours[]> | null = null;

  constructor(private httpClient: HttpClient) { }

  getAll(niveauEtudeId?: number | string): Observable<Parcours[]> {
    if (niveauEtudeId != null) {
      const params = { niveauEtudeId: String(niveauEtudeId) }
      return this.httpClient.get<Parcours[]>(`${this.SERVICE_URL}`, { params })
    }
    if (!this.cached$) {
      this.cached$ = this.httpClient.get<Parcours[]>(`${this.SERVICE_URL}`).pipe(shareReplay(1))
    }
    return this.cached$;
  }

  invalidate(): void {
    this.cached$ = null;
  }

  get(id: string): Observable<Parcours> {
    return this.httpClient.get<Parcours>(`${this.SERVICE_URL}/${id}`)
  }

  create(parcours: Parcours): Observable<Parcours> {
    return this.httpClient.post<Parcours>(`${this.SERVICE_URL}`, parcours)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
