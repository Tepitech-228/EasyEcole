import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class DevoirService {
  private readonly URL = `${environment.API_MODULES.ELEARNING}/devoirs`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> { return this.http.get<any[]>(this.URL); }
  get(id: string): Observable<any> { return this.http.get<any>(`${this.URL}/${id}`); }
  create(data: any): Observable<any> { return this.http.post<any>(this.URL, data); }
  soumettre(id: string, formData: FormData): Observable<any> { return this.http.post<any>(`${this.URL}/${id}/soumettre`, formData); }
  noter(id: string, soumissionId: string, data: any): Observable<any> { return this.http.put<any>(`${this.URL}/${id}/noter/${soumissionId}`, data); }
  downloadSoumission(id: string, soumissionId: string): Observable<Blob> { return this.http.get(`${this.URL}/${id}/download/${soumissionId}`, { responseType: 'blob' }); }
  delete(id: string): Observable<any> { return this.http.delete(`${this.URL}/${id}`); }
}
