import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RhFormation } from '../models/RhFormation.model';

@Injectable({
  providedIn: 'root'
})
export class RhFormationService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.RH}/formations`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<RhFormation[]> {
    return this.httpClient.get<RhFormation[]>(this.SERVICE_URL);
  }

  get(id: string): Observable<RhFormation> {
    return this.httpClient.get<RhFormation>(`${this.SERVICE_URL}/${id}`);
  }

  create(item: RhFormation): Observable<RhFormation> {
    return this.httpClient.post<RhFormation>(this.SERVICE_URL, item);
  }

  update(item: RhFormation): Observable<RhFormation> {
    return this.httpClient.put<RhFormation>(`${this.SERVICE_URL}/${item.id!}`, item);
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`);
  }
}