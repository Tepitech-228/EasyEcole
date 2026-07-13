import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CursusApprenant } from '../models/CursusApprenant.model';

@Injectable({
  providedIn: 'root'
})
export class CursusApprenantService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/cursusApprenant`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<CursusApprenant[]> {
    return this.httpClient.get<CursusApprenant[]>(`${this.SERVICE_URL}`)
  }

  get(id: string): Observable<CursusApprenant> {
    return this.httpClient.get<CursusApprenant>(`${this.SERVICE_URL}/${id}`)
  }

  getCoursChoisis(id?: string): Observable<CursusApprenant> {
    return this.httpClient.get<CursusApprenant>(`${this.SERVICE_URL}/${id}/cours`)
  }

  create(cursusApprenant: CursusApprenant): Observable<CursusApprenant> {
    return this.httpClient.post<CursusApprenant>(`${this.SERVICE_URL}`, cursusApprenant)
  }

  update(cursusApprenant: CursusApprenant): Observable<CursusApprenant> {
    return this.httpClient.put<CursusApprenant>(`${this.SERVICE_URL}/${cursusApprenant.id!}`, cursusApprenant)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
