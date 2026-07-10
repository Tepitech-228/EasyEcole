import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PlanningPersonnel {
  id?: string;
  employeId: string;
  jourSemaine: string;
  heureDebut: string;
  heureFin: string;
  tache: string;
  couleur?: string;
  dateDebut: string;
  dateFin: string;
  description?: string;
  employe?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PlanningPersonnelService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.RH}/planning-personnel`

  constructor(private httpClient: HttpClient) { }

  getAll(employeId?: string): Observable<PlanningPersonnel[]> {
    let url = this.SERVICE_URL;
    if (employeId) url += `?employeId=${employeId}`;
    return this.httpClient.get<PlanningPersonnel[]>(url);
  }

  get(id: string): Observable<PlanningPersonnel> {
    return this.httpClient.get<PlanningPersonnel>(`${this.SERVICE_URL}/${id}`);
  }

  create(data: PlanningPersonnel): Observable<PlanningPersonnel> {
    return this.httpClient.post<PlanningPersonnel>(this.SERVICE_URL, data);
  }

  update(data: PlanningPersonnel): Observable<PlanningPersonnel> {
    return this.httpClient.put<PlanningPersonnel>(`${this.SERVICE_URL}/${data.id!}`, data);
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`);
  }

  getPersonnelPlanning(): Observable<PlanningPersonnel[]> {
    return this.httpClient.get<PlanningPersonnel[]>(`${this.SERVICE_URL}/personnel`);
  }
}
