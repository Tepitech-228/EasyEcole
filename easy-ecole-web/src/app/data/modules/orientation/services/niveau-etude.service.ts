import { Injectable } from '@angular/core';
import { NiveauEtude } from '../models/NiveauEtude.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NiveauEtudeService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.ORIENTATION}/niveauxEtude`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<NiveauEtude[]> {
    return this.httpClient.get<NiveauEtude[]>(`${this.SERVICE_URL}`)
  }
}
