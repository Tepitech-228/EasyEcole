import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MouvementStock } from '../models/MouvementStock.model';

@Injectable({ providedIn: 'root' })
export class MouvementStockService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.STOCKS}/mouvements`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<MouvementStock[]> { return this.httpClient.get<MouvementStock[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<MouvementStock> { return this.httpClient.get<MouvementStock>(`${this.SERVICE_URL}/${id}`) }
    create(item: MouvementStock): Observable<MouvementStock> { return this.httpClient.post<MouvementStock>(`${this.SERVICE_URL}`, item) }
    update(item: MouvementStock): Observable<MouvementStock> { return this.httpClient.put<MouvementStock>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
