import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly URL = `${environment.API_MODULES.ELEARNING}/quiz`;
  constructor(private http: HttpClient) {}

  getAll(coursId?: string): Observable<any[]> {
    return this.http.get<any[]>(coursId ? `${this.URL}?coursId=${coursId}` : this.URL);
  }
  get(id: string): Observable<any> { return this.http.get<any>(`${this.URL}/${id}`); }
  create(data: any): Observable<any> { return this.http.post<any>(this.URL, data); }
  repondre(id: string, reponses: any[]): Observable<any> { return this.http.post<any>(`${this.URL}/${id}/repondre`, { reponses }); }
  resultat(id: string): Observable<any> { return this.http.get<any>(`${this.URL}/${id}/resultat`); }
  delete(id: string): Observable<any> { return this.http.delete(`${this.URL}/${id}`); }
}
