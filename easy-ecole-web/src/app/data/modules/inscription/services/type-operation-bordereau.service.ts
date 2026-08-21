import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TypeOperationBordereau } from '../models/TypeOperationBordereau.model';

@Injectable({
  providedIn: 'root'
})
export class TypeOperationBordereauService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/types-operations-bordereau`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<TypeOperationBordereau[]> {
    return this.httpClient.get<TypeOperationBordereau[]>(this.SERVICE_URL)
  }

  getActive(): Observable<TypeOperationBordereau[]> {
    return this.httpClient.get<TypeOperationBordereau[]>(`${this.SERVICE_URL}/actifs`)
  }

  get(id: number | string): Observable<TypeOperationBordereau> {
    return this.httpClient.get<TypeOperationBordereau>(`${this.SERVICE_URL}/${id}`)
  }

  create(data: TypeOperationBordereau): Observable<TypeOperationBordereau> {
    return this.httpClient.post<TypeOperationBordereau>(this.SERVICE_URL, data)
  }

  update(id: number | string, data: TypeOperationBordereau): Observable<TypeOperationBordereau> {
    return this.httpClient.put<TypeOperationBordereau>(`${this.SERVICE_URL}/${id}`, data)
  }

  delete(id: number | string): Observable<any> {
    return this.httpClient.delete<any>(`${this.SERVICE_URL}/${id}`)
  }
}
