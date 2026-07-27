import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AffectationImmobilisation } from '../models/AffectationImmobilisation.model';

@Injectable({ providedIn: 'root' })
export class AffectationService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.IMMOBILISATIONS}/affectations`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<AffectationImmobilisation[]> { return this.httpClient.get<AffectationImmobilisation[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<AffectationImmobilisation> { return this.httpClient.get<AffectationImmobilisation>(`${this.SERVICE_URL}/${id}`) }
    create(item: AffectationImmobilisation): Observable<AffectationImmobilisation> { return this.httpClient.post<AffectationImmobilisation>(`${this.SERVICE_URL}`, item) }
    update(item: AffectationImmobilisation): Observable<AffectationImmobilisation> { return this.httpClient.put<AffectationImmobilisation>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
