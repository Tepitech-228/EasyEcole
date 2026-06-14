import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Institution } from '../models/Institution.model';

@Injectable({
  providedIn: 'root'
})
export class InstitutionService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.AUTH}/institutions`

  constructor(private httpClient: HttpClient) { }

  get(id?: string): Observable<Institution> {
    return this.httpClient.get<Institution>(`${this.SERVICE_URL}/${id}`)
  }

  update(institution: Institution): Observable<Institution> {
    return this.httpClient.put<Institution>(`${this.SERVICE_URL}/`, institution)
  }
}
