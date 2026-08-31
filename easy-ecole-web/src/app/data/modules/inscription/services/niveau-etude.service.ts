import { Injectable } from '@angular/core';
import { NiveauEtude } from '../models/NiveauEtude.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NiveauEtudeService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/niveauxEtude`

  private cached$: Observable<NiveauEtude[]> | null = null;

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<NiveauEtude[]> {
    if (!this.cached$) {
      this.cached$ = this.httpClient.get<NiveauEtude[]>(`${this.SERVICE_URL}`).pipe(shareReplay(1))
    }
    return this.cached$;
  }

  invalidate(): void {
    this.cached$ = null;
  }
}
