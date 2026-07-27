import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CorrectionStock } from '../models/CorrectionStock.model';

@Injectable({ providedIn: 'root' })
export class CorrectionStockService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.STOCKS}/corrections-stock`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<CorrectionStock[]> { return this.httpClient.get<CorrectionStock[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<CorrectionStock> { return this.httpClient.get<CorrectionStock>(`${this.SERVICE_URL}/${id}`) }
    create(item: CorrectionStock): Observable<CorrectionStock> { return this.httpClient.post<CorrectionStock>(`${this.SERVICE_URL}`, item) }
    update(item: CorrectionStock): Observable<CorrectionStock> { return this.httpClient.put<CorrectionStock>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
