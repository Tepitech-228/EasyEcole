import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Communication } from '../models/Communication.model';

@Injectable({
  providedIn: 'root'
})
export class CommunicationService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.COMMUNICATION}/communications`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<Communication[]> {
    return this.httpClient.get<Communication[]>(`${this.SERVICE_URL}`)
  }

  get(id: string): Observable<Communication> {
    return this.httpClient.get<Communication>(`${this.SERVICE_URL}/${id}`)
  }

  create(communication: Communication): Observable<Communication> {
    return this.httpClient.post<Communication>(`${this.SERVICE_URL}`, communication)
  }

  update(id: string, communication: Communication): Observable<Communication> {
    return this.httpClient.put<Communication>(`${this.SERVICE_URL}/${id}`, communication)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
