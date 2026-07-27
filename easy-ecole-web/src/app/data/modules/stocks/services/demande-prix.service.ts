import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DemandePrix } from '../models/DemandePrix.model';

@Injectable({ providedIn: 'root' })
export class DemandePrixService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.STOCKS}/demandes-prix`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<DemandePrix[]> { return this.httpClient.get<DemandePrix[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<DemandePrix> { return this.httpClient.get<DemandePrix>(`${this.SERVICE_URL}/${id}`) }
    create(item: DemandePrix): Observable<DemandePrix> { return this.httpClient.post<DemandePrix>(`${this.SERVICE_URL}`, item) }
    update(item: DemandePrix): Observable<DemandePrix> { return this.httpClient.put<DemandePrix>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
