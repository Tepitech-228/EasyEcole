import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PrerequisParcoursChoisi } from '../models/PrerequisParcoursChoisi.model';

@Injectable({
  providedIn: 'root'
})
export class PrerequisParcoursChoisiChoisiService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/prerequisParcoursChoisis`

  constructor(private httpClient: HttpClient) { }

  create(prerequisParcoursChoisi: PrerequisParcoursChoisi): Observable<PrerequisParcoursChoisi> {
    return this.httpClient.post<PrerequisParcoursChoisi>(`${this.SERVICE_URL}`, prerequisParcoursChoisi)
  }
}
