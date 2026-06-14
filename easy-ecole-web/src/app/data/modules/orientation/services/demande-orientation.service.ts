import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { DemandeOrientation } from '../models/DemandeOrientation.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DemandeOrientationService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.ORIENTATION}/demandesOrientation`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<DemandeOrientation[]> {
    return this.httpClient.get<DemandeOrientation[]>(`${this.SERVICE_URL}`)
  }

  get(id: string): Observable<DemandeOrientation> {
    return this.httpClient.get<DemandeOrientation>(`${this.SERVICE_URL}/${id}`)
  }

  create(demandeOrientation: DemandeOrientation): Observable<DemandeOrientation> {
    return this.httpClient.post<DemandeOrientation>(`${this.SERVICE_URL}`, demandeOrientation)
  }
}
