import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Batiment } from '../models/Batiment.model';

@Injectable({ providedIn: 'root' })
export class BatimentService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.IMMOBILISATIONS}/batiments`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<Batiment[]> { return this.httpClient.get<Batiment[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<Batiment> { return this.httpClient.get<Batiment>(`${this.SERVICE_URL}/${id}`) }
    create(item: Batiment): Observable<Batiment> { return this.httpClient.post<Batiment>(`${this.SERVICE_URL}`, item) }
    update(item: Batiment): Observable<Batiment> { return this.httpClient.put<Batiment>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
