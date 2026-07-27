import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DocGenCachet } from '../models/DocGenCachet.model';

@Injectable({ providedIn: 'root' })
export class DocGenCachetService {
  private readonly API = `${environment.API_URL}/docgen/cachets`;
  constructor(private http: HttpClient) { }

  getAll(): Observable<DocGenCachet[]> { return this.http.get<DocGenCachet[]>(this.API); }
  getActive(): Observable<DocGenCachet> { return this.http.get<DocGenCachet>(`${this.API}/active`); }
  upload(formData: FormData): Observable<DocGenCachet> { return this.http.post<DocGenCachet>(`${this.API}/upload`, formData); }
  update(id: string, data: Partial<DocGenCachet>): Observable<DocGenCachet> { return this.http.put<DocGenCachet>(`${this.API}/${id}`, data); }
  setActive(id: string): Observable<DocGenCachet> { return this.http.put<DocGenCachet>(`${this.API}/${id}/active`, {}); }
  delete(id: string): Observable<any> { return this.http.delete(`${this.API}/${id}`); }
}
