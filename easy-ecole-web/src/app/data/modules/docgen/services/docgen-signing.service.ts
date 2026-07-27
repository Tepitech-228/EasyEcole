import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class DocGenSigningService {
  private readonly API = `${environment.API_URL}/docgen/signatures`;
  constructor(private http: HttpClient) { }

  getPendingForTeacher(): Observable<any[]> { return this.http.get<any[]>(`${this.API}/pending/enseignant`); }
  getPendingForDirector(): Observable<any[]> { return this.http.get<any[]>(`${this.API}/pending/direction`); }
  getDocumentsByClasse(classe: string, statut?: string): Observable<any[]> {
    const params: any = statut ? { statut } : {};
    return this.http.get<any[]>(`${this.API}/documents/${classe}`, { params });
  }
  signBatch(documentIds: number[], signataireId: number, signataireType: string): Observable<any> {
    return this.http.post(`${this.API}/batch`, { documentIds, signataireId, signataireType });
  }
}
