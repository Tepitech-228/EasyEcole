import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Commande } from '../models/achats.models';

@Injectable({ providedIn: 'root' })
export class CommandeService {
  private readonly URL = `${environment.API_MODULES.ACHATS}/commandes`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Commande[]> {
    return this.http.get<Commande[]>(this.URL);
  }

  get(id: number | string): Observable<Commande> {
    return this.http.get<Commande>(`${this.URL}/${id}`);
  }

  create(data: Partial<Commande>): Observable<Commande> {
    return this.http.post<Commande>(this.URL, data);
  }

  update(id: number | string, data: Partial<Commande>): Observable<Commande> {
    return this.http.put<Commande>(`${this.URL}/${id}`, data);
  }

  delete(id: number | string): Observable<any> {
    return this.http.delete(`${this.URL}/${id}`);
  }
}
