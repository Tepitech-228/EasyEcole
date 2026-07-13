import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RhEmployeService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.RH}/employes`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<any[]> {
    return this.httpClient.get<any[]>(this.SERVICE_URL);
  }

  get(id: string): Observable<any> {
    return this.httpClient.get<any>(`${this.SERVICE_URL}/${id}`);
  }

  create(data: any): Observable<any> {
    return this.httpClient.post(this.SERVICE_URL, data);
  }

  update(data: any): Observable<any> {
    return this.httpClient.put(`${this.SERVICE_URL}/${data.id!}`, data);
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`);
  }

  getCount(): Observable<{ count: number }> {
    return this.httpClient.get<{ count: number }>(`${this.SERVICE_URL}/statistics/count`);
  }
}
