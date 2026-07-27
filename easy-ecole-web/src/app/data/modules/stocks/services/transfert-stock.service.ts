import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TransfertStock } from '../models/TransfertStock.model';

@Injectable({ providedIn: 'root' })
export class TransfertStockService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.STOCKS}/transferts`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<TransfertStock[]> { return this.httpClient.get<TransfertStock[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<TransfertStock> { return this.httpClient.get<TransfertStock>(`${this.SERVICE_URL}/${id}`) }
    create(item: TransfertStock): Observable<TransfertStock> { return this.httpClient.post<TransfertStock>(`${this.SERVICE_URL}`, item) }
    update(item: TransfertStock): Observable<TransfertStock> { return this.httpClient.put<TransfertStock>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
    annuler(id: string): Observable<TransfertStock> { return this.httpClient.post<TransfertStock>(`${this.SERVICE_URL}/${id}/annuler`, {}) }
}
