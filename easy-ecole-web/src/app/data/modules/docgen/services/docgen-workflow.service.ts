import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DocGenWorkflow } from '../models/DocGenWorkflow.model';

@Injectable({ providedIn: 'root' })
export class DocGenWorkflowService {
  private readonly API = `${environment.API_URL}/docgen/workflows`;
  constructor(private http: HttpClient) { }

  getByType(typeId: string): Observable<DocGenWorkflow[]> { return this.http.get<DocGenWorkflow[]>(`${this.API}/type/${typeId}`); }
  save(data: { typeId: string; steps: Partial<DocGenWorkflow>[] }): Observable<any> { return this.http.post(this.API, data); }
  delete(id: string): Observable<any> { return this.http.delete(`${this.API}/${id}`); }
}
