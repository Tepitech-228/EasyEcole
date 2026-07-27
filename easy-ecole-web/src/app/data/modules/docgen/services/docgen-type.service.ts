import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DocGenType } from '../models/DocGenType.model';

@Injectable({ providedIn: 'root' })
export class DocGenTypeService {
  private readonly API = `${environment.API_URL}/docgen/types`;
  constructor(private http: HttpClient) { }

  getAll(): Observable<DocGenType[]> { return this.http.get<DocGenType[]>(this.API); }
  getById(id: string): Observable<DocGenType> { return this.http.get<DocGenType>(`${this.API}/${id}`); }
  create(data: Partial<DocGenType>): Observable<DocGenType> { return this.http.post<DocGenType>(this.API, data); }
  update(id: string, data: Partial<DocGenType>): Observable<DocGenType> { return this.http.put<DocGenType>(`${this.API}/${id}`, data); }
  delete(id: string): Observable<any> { return this.http.delete(`${this.API}/${id}`); }
}
