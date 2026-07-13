import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PrerequisParcours } from '../models/PrerequisParcours.model';

@Injectable({
  providedIn: 'root'
})
export class PrerequisParcoursService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.ORIENTATION}/prerequisParcours`

  constructor(private httpClient: HttpClient) { }

  create(prerequisParcours: PrerequisParcours): Observable<PrerequisParcours> {
    return this.httpClient.post<PrerequisParcours>(`${this.SERVICE_URL}`, prerequisParcours)
  }
}
