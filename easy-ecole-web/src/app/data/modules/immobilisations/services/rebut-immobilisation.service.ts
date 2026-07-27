import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RebutImmobilisation } from '../models/RebutImmobilisation.model';

@Injectable({ providedIn: 'root' })
export class RebutImmobilisationService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.IMMOBILISATIONS}/rebuts`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<RebutImmobilisation[]> { return this.httpClient.get<RebutImmobilisation[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<RebutImmobilisation> { return this.httpClient.get<RebutImmobilisation>(`${this.SERVICE_URL}/${id}`) }
    create(item: RebutImmobilisation): Observable<RebutImmobilisation> { return this.httpClient.post<RebutImmobilisation>(`${this.SERVICE_URL}`, item) }
    update(item: RebutImmobilisation): Observable<RebutImmobilisation> { return this.httpClient.put<RebutImmobilisation>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
