import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Cession } from '../models/Cession.model';

@Injectable({ providedIn: 'root' })
export class CessionService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.IMMOBILISATIONS}/cessions`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<Cession[]> { return this.httpClient.get<Cession[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<Cession> { return this.httpClient.get<Cession>(`${this.SERVICE_URL}/${id}`) }
    create(item: Cession): Observable<Cession> { return this.httpClient.post<Cession>(`${this.SERVICE_URL}`, item) }
    update(item: Cession): Observable<Cession> { return this.httpClient.put<Cession>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
