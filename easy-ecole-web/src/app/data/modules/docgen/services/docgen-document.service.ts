import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DocGenDocument } from '../models/DocGenDocument.model';

export interface DocGenGenerateStudentData {
  typeCode: string;
  sourceType?: string;
  sourceId?: number;
  metadata?: any;
  params?: any;
}

export interface DocGenStudentResponse {
  success: boolean;
  data: DocGenDocument[];
}

@Injectable({ providedIn: 'root' })
export class DocGenDocumentService {
  private readonly API = `${environment.API_URL}/docgen/documents`;
  private readonly STUDENT_API = `${environment.API_URL}/docgen/student`;
  constructor(private http: HttpClient) { }

  getAll(params?: any): Observable<DocGenDocument[]> { return this.http.get<DocGenDocument[]>(this.API, { params }); }
  getById(id: string): Observable<DocGenDocument> { return this.http.get<DocGenDocument>(`${this.API}/${id}`); }
  generate(data: {
    typeCode: string;
    sourceType?: string;
    sourceId?: number;
    metadata?: any;
    envoyerMail?: boolean;
    etudiantId?: number;
    classeId?: number;
    anneeAcademiqueId?: number;
    semestre?: string;
    cursusApprenantId?: number;
  }): Observable<DocGenDocument> { return this.http.post<DocGenDocument>(`${this.API}/generate`, data); }
  download(id: string): Observable<Blob> { return this.http.get(`${this.API}/${id}/download`, { responseType: 'blob' }); }
  delete(id: string): Observable<any> { return this.http.delete(`${this.API}/${id}`); }

  /** Génère un document pour l'étudiant connecté (garde AuthApprenant). Types autorisés : PRE001, ADM020. */
  generateStudent(data: DocGenGenerateStudentData): Observable<DocGenStudentResponse> {
    return this.http.post<DocGenStudentResponse>(`${this.STUDENT_API}/generate`, data);
  }

  /** Liste les documents générés de l'étudiant connecté. */
  getMyDocuments(): Observable<DocGenStudentResponse> {
    return this.http.get<DocGenStudentResponse>(`${this.STUDENT_API}/documents`);
  }
}
