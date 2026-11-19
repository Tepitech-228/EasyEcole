import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Ecue } from '../models/Ecue.model';

export interface EcueAffectation extends Ecue {
  cours?: {
    id?: string;
    code?: string;
    intitule?: string;
    credit?: number;
    creditEcts?: number;
    semestre?: string;
    parcoursId?: string;
    parcours?: {
      id?: string;
      titre?: string;
      type?: string;
      niveauEtudeId?: string;
      niveauEtude?: { id?: string; libelle?: string };
    };
    classe?: { id?: string; libelle?: string };
  };
}

@Injectable({
  providedIn: 'root'
})
export class EcueService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/ecues`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<Ecue[]> {
    return this.httpClient.get<Ecue[]>(`${this.SERVICE_URL}`)
  }

  getForTeacherAssignments(): Observable<EcueAffectation[]> {
    return this.httpClient.get<EcueAffectation[]>(`${this.SERVICE_URL}/affectations-enseignants`)
  }

  get(id: string): Observable<Ecue> {
    return this.httpClient.get<Ecue>(`${this.SERVICE_URL}/${id}`)
  }

  getByUe(ueId: string): Observable<Ecue[]> {
    return this.httpClient.get<Ecue[]>(`${this.SERVICE_URL}/by-ue/${ueId}`)
  }

  create(ecue: Ecue): Observable<Ecue> {
    return this.httpClient.post<Ecue>(`${this.SERVICE_URL}`, ecue)
  }

  update(ecue: Ecue): Observable<Ecue> {
    return this.httpClient.put<Ecue>(`${this.SERVICE_URL}/${ecue.id!}`, ecue)
  }

  assignerEnseignant(ecueId: string, enseignantId: string | null): Observable<EcueAffectation> {
    return this.httpClient.patch<EcueAffectation>(`${this.SERVICE_URL}/${ecueId}/enseignant`, { enseignantId })
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
