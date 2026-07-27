import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DocGenDocument } from '../models/DocGenDocument.model';

@Injectable({ providedIn: 'root' })
export class DocGenDocumentService {
  private readonly API = `${environment.API_URL}/docgen/documents`;
  constructor(private http: HttpClient) { }

  getAll(params?: any): Observable<DocGenDocument[]> { return this.http.get<DocGenDocument[]>(this.API, { params }); }
  getById(id: string): Observable<DocGenDocument> { return this.http.get<DocGenDocument>(`${this.API}/${id}`); }
  generate(data: { typeCode: string; sourceType?: string; sourceId?: number; metadata?: any }): Observable<DocGenDocument> { return this.http.post<DocGenDocument>(`${this.API}/generate`, data); }
  download(id: string): Observable<Blob> { return this.http.get(`${this.API}/${id}/download`, { responseType: 'blob' }); }
  delete(id: string): Observable<any> { return this.http.delete(`${this.API}/${id}`); }
}
