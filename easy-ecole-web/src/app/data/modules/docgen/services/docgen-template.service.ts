import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DocGenTemplate } from '../models/DocGenTemplate.model';

@Injectable({ providedIn: 'root' })
export class DocGenTemplateService {
  private readonly API = `${environment.API_URL}/docgen/templates`;
  constructor(private http: HttpClient) { }

  getAll(typeId?: string): Observable<DocGenTemplate[]> {
    const params = typeId ? `?typeId=${typeId}` : '';
    return this.http.get<DocGenTemplate[]>(`${this.API}${params}`);
  }
  getById(id: string): Observable<DocGenTemplate> { return this.http.get<DocGenTemplate>(`${this.API}/${id}`); }
  create(data: Partial<DocGenTemplate>): Observable<DocGenTemplate> { return this.http.post<DocGenTemplate>(this.API, data); }
  update(id: string, data: Partial<DocGenTemplate>): Observable<DocGenTemplate> { return this.http.put<DocGenTemplate>(`${this.API}/${id}`, data); }
  delete(id: string): Observable<any> { return this.http.delete(`${this.API}/${id}`); }
  preview(contenu: string, variables: any): Observable<any> { return this.http.post(`${this.API}/preview`, { contenu, variables }, { responseType: 'text' }); }
}
