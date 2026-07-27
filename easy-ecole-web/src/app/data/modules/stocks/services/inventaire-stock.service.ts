import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { InventaireStock } from '../models/InventaireStock.model';

@Injectable({ providedIn: 'root' })
export class InventaireStockService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.STOCKS}/inventaires`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<InventaireStock[]> { return this.httpClient.get<InventaireStock[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<InventaireStock> { return this.httpClient.get<InventaireStock>(`${this.SERVICE_URL}/${id}`) }
    create(item: InventaireStock): Observable<InventaireStock> { return this.httpClient.post<InventaireStock>(`${this.SERVICE_URL}`, item) }
    update(item: InventaireStock): Observable<InventaireStock> { return this.httpClient.put<InventaireStock>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
