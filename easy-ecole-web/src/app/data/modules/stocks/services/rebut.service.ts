import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Rebut } from '../models/Rebut.model';

@Injectable({ providedIn: 'root' })
export class RebutService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.STOCKS}/rebuts`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<Rebut[]> { return this.httpClient.get<Rebut[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<Rebut> { return this.httpClient.get<Rebut>(`${this.SERVICE_URL}/${id}`) }
    create(item: Rebut): Observable<Rebut> { return this.httpClient.post<Rebut>(`${this.SERVICE_URL}`, item) }
    update(item: Rebut): Observable<Rebut> { return this.httpClient.put<Rebut>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
