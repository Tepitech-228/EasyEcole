import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GrilleSalariale } from '../models/GrilleSalariale.model';

@Injectable({ providedIn: 'root' })
export class RhGrilleSalarialeService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.RH}/grilles-salariales`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<GrilleSalariale[]> { return this.httpClient.get<GrilleSalariale[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<GrilleSalariale> { return this.httpClient.get<GrilleSalariale>(`${this.SERVICE_URL}/${id}`) }
    create(item: GrilleSalariale): Observable<GrilleSalariale> { return this.httpClient.post<GrilleSalariale>(`${this.SERVICE_URL}`, item) }
    update(item: GrilleSalariale): Observable<GrilleSalariale> { return this.httpClient.put<GrilleSalariale>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
