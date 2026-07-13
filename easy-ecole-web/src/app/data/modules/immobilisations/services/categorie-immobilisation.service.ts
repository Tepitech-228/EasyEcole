import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CategorieImmobilisation } from '../models/CategorieImmobilisation.model';

@Injectable({ providedIn: 'root' })
export class CategorieImmobilisationService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.IMMOBILISATIONS}/categories`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<CategorieImmobilisation[]> { return this.httpClient.get<CategorieImmobilisation[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<CategorieImmobilisation> { return this.httpClient.get<CategorieImmobilisation>(`${this.SERVICE_URL}/${id}`) }
    create(item: CategorieImmobilisation): Observable<CategorieImmobilisation> { return this.httpClient.post<CategorieImmobilisation>(`${this.SERVICE_URL}`, item) }
    update(item: CategorieImmobilisation): Observable<CategorieImmobilisation> { return this.httpClient.put<CategorieImmobilisation>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
