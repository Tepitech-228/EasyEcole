import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Enseignant } from '../../auth/models/Enseignant.model';
import { Cours } from '../models/Cours.model';
import { CoursParticipant } from '../models/CoursParticipant.model';

@Injectable({
  providedIn: 'root'
})
export class CoursService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/cours`

  constructor(private httpClient: HttpClient) { }

  getAll(parcoursId?: string): Observable<Cours[]> {
    return this.httpClient.get<Cours[]>(parcoursId ? `${this.SERVICE_URL}?parcoursId=${parcoursId}` : `${this.SERVICE_URL}`)
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

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}