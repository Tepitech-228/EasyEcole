import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class CertificatService {
  private readonly URL = `${environment.API_MODULES.ELEARNING}/certificats`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> { return this.http.get<any[]>(this.URL); }
  create(data: any): Observable<any> { return this.http.post<any>(this.URL, data); }
  delete(id: string): Observable<any> { return this.http.delete(`${this.URL}/${id}`); }
}
