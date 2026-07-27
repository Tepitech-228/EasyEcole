import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { QuaNonConformite } from '../models/QuaNonConformite.model';

@Injectable({ providedIn: 'root' })
export class QualiteNonConformiteService {
  private readonly API = `${environment.API_URL}/qualite/non-conformites`;
  constructor(private http: HttpClient) { }

  getAll(): Observable<QuaNonConformite[]> { return this.http.get<QuaNonConformite[]>(this.API); }
  getById(id: string): Observable<QuaNonConformite> { return this.http.get<QuaNonConformite>(`${this.API}/${id}`); }
  create(data: Partial<QuaNonConformite>): Observable<QuaNonConformite> { return this.http.post<QuaNonConformite>(this.API, data); }
  update(id: string, data: Partial<QuaNonConformite>): Observable<QuaNonConformite> { return this.http.put<QuaNonConformite>(`${this.API}/${id}`, data); }
  delete(id: string): Observable<any> { return this.http.delete(`${this.API}/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class QualiteActionCorrectiveService {
  private readonly API = `${environment.API_URL}/qualite/actions-correctives`;
  constructor(private http: HttpClient) { }

  getAll(): Observable<any[]> { return this.http.get<any[]>(this.API); }
  create(data: any): Observable<any> { return this.http.post(this.API, data); }
  update(id: string, data: any): Observable<any> { return this.http.put(`${this.API}/${id}`, data); }
  delete(id: string): Observable<any> { return this.http.delete(`${this.API}/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class QualiteAuditService {
  private readonly API = `${environment.API_URL}/qualite/audits`;
  constructor(private http: HttpClient) { }

  getAll(): Observable<any[]> { return this.http.get<any[]>(this.API); }
  getById(id: string): Observable<any> { return this.http.get(`${this.API}/${id}`); }
  create(data: any): Observable<any> { return this.http.post(this.API, data); }
  update(id: string, data: any): Observable<any> { return this.http.put(`${this.API}/${id}`, data); }
  delete(id: string): Observable<any> { return this.http.delete(`${this.API}/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class QualiteRevueDirectionService {
  private readonly API = `${environment.API_URL}/qualite/revues-direction`;
  constructor(private http: HttpClient) { }

  getAll(): Observable<any[]> { return this.http.get<any[]>(this.API); }
  getById(id: string): Observable<any> { return this.http.get(`${this.API}/${id}`); }
  create(data: any): Observable<any> { return this.http.post(this.API, data); }
  update(id: string, data: any): Observable<any> { return this.http.put(`${this.API}/${id}`, data); }
  delete(id: string): Observable<any> { return this.http.delete(`${this.API}/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class QualiteEnqueteSatisfactionService {
  private readonly API = `${environment.API_URL}/qualite/enquetes-satisfaction`;
  constructor(private http: HttpClient) { }

  getAll(): Observable<any[]> { return this.http.get<any[]>(this.API); }
  getById(id: string): Observable<any> { return this.http.get(`${this.API}/${id}`); }
  create(data: any): Observable<any> { return this.http.post(this.API, data); }
  update(id: string, data: any): Observable<any> { return this.http.put(`${this.API}/${id}`, data); }
  delete(id: string): Observable<any> { return this.http.delete(`${this.API}/${id}`); }
  getStatistiques(id: string): Observable<any> { return this.http.get(`${this.API}/statistiques/${id}`); }
}
