import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Amortissement } from '../models/Amortissement.model';

@Injectable({ providedIn: 'root' })
export class AmortissementService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.IMMOBILISATIONS}/amortissements`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<Amortissement[]> { return this.httpClient.get<Amortissement[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<Amortissement> { return this.httpClient.get<Amortissement>(`${this.SERVICE_URL}/${id}`) }
    create(item: Amortissement): Observable<Amortissement> { return this.httpClient.post<Amortissement>(`${this.SERVICE_URL}`, item) }
    update(item: Amortissement): Observable<Amortissement> { return this.httpClient.put<Amortissement>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
