import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CourseStatus } from '../../../../shared/components/course-status-badge/course-status-badge.component';
import { environment } from 'src/environments/environment';

export interface CoursStatut {
  coursId: number;
  coursIntitule: string;
  statut: CourseStatus;
  moyenne?: number;
  creditEcts?: number;
}

@Injectable({ providedIn: 'root' })
export class CoursStatutService {
  private apiUrl = `${environment.apiUrl}/inscription`;

  constructor(private http: HttpClient) {}

  getStatutsCours(): Observable<CoursStatut[]> {
    return this.http.get<CoursStatut[]>(`${this.apiUrl}/cursusApprenant/mon-suivi/statuts-cours`);
  }

  getStatutCours(coursId: number): Observable<CoursStatut> {
    return this.http.get<CoursStatut>(`${this.apiUrl}/cursusApprenant/mon-suivi/statuts-cours/${coursId}`);
  }
}
