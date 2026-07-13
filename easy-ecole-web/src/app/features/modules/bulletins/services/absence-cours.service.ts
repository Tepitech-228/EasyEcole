import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AbsenceCoursService {
  private apiUrl = `${environment.API_URL}/inscription`;

  constructor(private http: HttpClient) {}

  getAbsencesByEtudiant(cursusApprenantId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/absences-cours/etudiant/${cursusApprenantId}`);
  }

  getStatsByEtudiant(cursusApprenantId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/absences-cours/etudiant/${cursusApprenantId}/stats`);
  }

  getAbsencesByClasse(classeId: number, anneeAcademiqueId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/absences-cours/classe/${classeId}/annee/${anneeAcademiqueId}`);
  }
}
