import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TypeDocument } from '../models/TypeDocument.model';

@Injectable({ providedIn: 'root' })
export class TypeDocumentService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.SCOLARITE}/typesDocument`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<TypeDocument[]> {
    return this.httpClient.get<TypeDocument[]>(`${this.SERVICE_URL}/`)
  }

  get(id: string): Observable<TypeDocument> {
    return this.httpClient.get<TypeDocument>(`${this.SERVICE_URL}/${id}`)
  }

  create(data: TypeDocument): Observable<TypeDocument> {
    return this.httpClient.post<TypeDocument>(`${this.SERVICE_URL}`, data)
  }

  update(data: TypeDocument): Observable<TypeDocument> {
    return this.httpClient.put<TypeDocument>(`${this.SERVICE_URL}/${data.id!}`, data)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
