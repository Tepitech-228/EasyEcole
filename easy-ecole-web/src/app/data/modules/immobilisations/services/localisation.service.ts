import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Localisation } from '../models/Localisation.model';

@Injectable({ providedIn: 'root' })
export class LocalisationService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.IMMOBILISATIONS}/localisations`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<Localisation[]> { return this.httpClient.get<Localisation[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<Localisation> { return this.httpClient.get<Localisation>(`${this.SERVICE_URL}/${id}`) }
    create(item: Localisation): Observable<Localisation> { return this.httpClient.post<Localisation>(`${this.SERVICE_URL}`, item) }
    update(item: Localisation): Observable<Localisation> { return this.httpClient.put<Localisation>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
