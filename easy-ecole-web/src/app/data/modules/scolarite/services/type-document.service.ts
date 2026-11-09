import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TarifTypeDocument, TypeDocument } from '../models/TypeDocument.model';

@Injectable({ providedIn: 'root' })
export class TypeDocumentService {
  private readonly SERVICE_URL: string = `${environment.API_MODULES.SCOLARITE}/typesDocument`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<TypeDocument[]> {
    return this.httpClient.get<TypeDocument[]>(`${this.SERVICE_URL}/`)
  }

  getTarifs(): Observable<TarifTypeDocument[]> {
    return this.httpClient.get<TarifTypeDocument[]>(`${this.SERVICE_URL}/tarifs`)
  }

  updateFrais(id: string | number, frais: number): Observable<TarifTypeDocument> {
    return this.httpClient.put<TarifTypeDocument>(`${this.SERVICE_URL}/${id}/frais`, { frais })
  }

  get(id: string): Observable<TypeDocument> {
    return this.httpClient.get<TypeDocument>(`${this.SERVICE_URL}/${id}`)
  }

  create(data: TypeDocument): Observable<TypeDocument> {
    return this.httpClient.post<TypeDocument>(`${this.SERVICE_URL}`, data)
  }

  update(data: Omit<TypeDocument, 'frais'> & { id: string }): Observable<TypeDocument> {
    return this.httpClient.put<TypeDocument>(`${this.SERVICE_URL}/${data.id}`, data)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
