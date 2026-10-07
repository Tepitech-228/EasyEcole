import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Shift } from '../models/Shift.model';

@Injectable({
  providedIn: 'root'
})
export class ShiftService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/shifts`

  constructor(private httpClient: HttpClient) { }

  getAll(actif?: boolean): Observable<Shift[]> {
    const url = actif === undefined ? this.SERVICE_URL : `${this.SERVICE_URL}?actif=${actif}`
    return this.httpClient.get<Shift[]>(url)
  }

  get(id: number): Observable<Shift> {
    return this.httpClient.get<Shift>(`${this.SERVICE_URL}/${id}`)
  }

  create(data: Partial<Shift>): Observable<Shift> {
    return this.httpClient.post<Shift>(this.SERVICE_URL, data)
  }

  update(id: number, data: Partial<Shift>): Observable<Shift> {
    return this.httpClient.put<Shift>(`${this.SERVICE_URL}/${id}`, data)
  }

  delete(id: number): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
