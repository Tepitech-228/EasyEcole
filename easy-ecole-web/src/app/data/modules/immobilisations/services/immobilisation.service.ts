import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Immobilisation } from '../models/Immobilisation.model';

@Injectable({ providedIn: 'root' })
export class ImmobilisationService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.IMMOBILISATIONS}/immobilisations`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<Immobilisation[]> { return this.httpClient.get<Immobilisation[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<Immobilisation> { return this.httpClient.get<Immobilisation>(`${this.SERVICE_URL}/${id}`) }
    create(item: Immobilisation): Observable<Immobilisation> { return this.httpClient.post<Immobilisation>(`${this.SERVICE_URL}`, item) }
    update(item: Immobilisation): Observable<Immobilisation> { return this.httpClient.put<Immobilisation>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
