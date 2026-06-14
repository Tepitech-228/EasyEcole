import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Site } from '../models/Site.model';

@Injectable({ providedIn: 'root' })
export class SiteService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.IMMOBILISATIONS}/sites`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<Site[]> { return this.httpClient.get<Site[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<Site> { return this.httpClient.get<Site>(`${this.SERVICE_URL}/${id}`) }
    create(item: Site): Observable<Site> { return this.httpClient.post<Site>(`${this.SERVICE_URL}`, item) }
    update(item: Site): Observable<Site> { return this.httpClient.put<Site>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
