import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Enseignant } from '../../auth/models/Enseignant.model';
import { Cours } from '../models/Cours.model';
import { CoursParticipant } from '../models/CoursParticipant.model';

export interface CoursGetAllParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
  parcoursId?: string;
  classeId?: string;
  semestre?: string;
  estObligatoire?: boolean;
  enseignantId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CoursService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/cours`

  constructor(private httpClient: HttpClient) { }

  getAll(parcoursId?: string): Observable<Cours[]> {
    return this.httpClient.get<Cours[]>(parcoursId ? `${this.SERVICE_URL}?parcoursId=${parcoursId}` : `${this.SERVICE_URL}`)
  }

  getAllPaginated(params?: CoursGetAllParams): Observable<PaginatedResponse<Cours>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page);
      if (params.limit) httpParams = httpParams.set('limit', params.limit);
      if (params.orderBy) httpParams = httpParams.set('orderBy', params.orderBy);
      if (params.orderDir) httpParams = httpParams.set('orderDir', params.orderDir);
      if (params.parcoursId) httpParams = httpParams.set('parcoursId', params.parcoursId);
      if (params.classeId) httpParams = httpParams.set('classeId', params.classeId);
      if (params.semestre) httpParams = httpParams.set('semestre', params.semestre);
      if (params.estObligatoire !== undefined) httpParams = httpParams.set('estObligatoire', params.estObligatoire);
      if (params.enseignantId) httpParams = httpParams.set('enseignantId', params.enseignantId);
    }
    return this.httpClient.get<PaginatedResponse<Cours>>(`${this.SERVICE_URL}`, { params: httpParams })
  }

  get(id: string): Observable<Cours> {
    return this.httpClient.get<Cours>(`${this.SERVICE_URL}/${id}`)
  }

  getParticipants(id: string): Observable<CoursParticipant[]> {
    return this.httpClient.get<CoursParticipant[]>(`${this.SERVICE_URL}/${id}/participants`)
  }

  create(cours: Cours): Observable<Cours> {
    return this.httpClient.post<Cours>(`${this.SERVICE_URL}`, cours)
  }

  update(cours: Cours): Observable<Cours> {
    return this.httpClient.put<Cours>(`${this.SERVICE_URL}/${cours.id!}`, cours)
  }

  getMesPresences(): Observable<Cours[]> {
    return this.httpClient.get<Cours[]>(`${this.SERVICE_URL}/mes-presences`)
  }

  assignerEnseignant(cours: Cours, enseignant: Enseignant): Observable<Cours> {
    return this.httpClient.put<Cours>(`${this.SERVICE_URL}/${cours.id!}/enseignant`, {enseignantId: enseignant.id!})
  }

  revoquerAssignationCours(cours: Cours): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${cours.id!}/enseignant`)
  }

  getArbrePedagogique(): Observable<any> {
    return this.httpClient.get<any>(`${environment.API_MODULES.INSCRIPTION}/arbre-pedagogique`)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}