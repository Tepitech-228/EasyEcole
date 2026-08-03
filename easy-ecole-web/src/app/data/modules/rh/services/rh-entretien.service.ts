import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RhEntretien } from '../models/RhEntretien.model';

@Injectable({
  providedIn: 'root'
})
export class RhEntretienService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.RH}/entretiens`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<RhEntretien[]> {
    return this.httpClient.get<RhEntretien[]>(this.SERVICE_URL);
  }

  get(id: string): Observable<RhEntretien> {
    return this.httpClient.get<RhEntretien>(`${this.SERVICE_URL}/${id}`);
  }

  create(item: RhEntretien): Observable<RhEntretien> {
    return this.httpClient.post<RhEntretien>(this.SERVICE_URL, item);
  }

  update(item: RhEntretien): Observable<RhEntretien> {
    return this.httpClient.put<RhEntretien>(`${this.SERVICE_URL}/${item.id!}`, item);
  }
}