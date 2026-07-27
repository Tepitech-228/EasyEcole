import { HttpClient, HttpParams } from '@angular/common/http';
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

  getAll(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.httpClient.get<any>(`${this.SERVICE_URL}`, { params: httpParams })
  }

  get(id: string): Observable<DemandeOrientation> {
    return this.httpClient.get<DemandeOrientation>(`${this.SERVICE_URL}/${id}`)
  }

  create(demandeOrientation: DemandeOrientation): Observable<DemandeOrientation> {
    return this.httpClient.post<DemandeOrientation>(`${this.SERVICE_URL}`, demandeOrientation)
  }
}
