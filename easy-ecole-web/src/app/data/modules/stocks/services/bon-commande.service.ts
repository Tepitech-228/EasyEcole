import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BonCommande } from '../models/BonCommande.model';

@Injectable({ providedIn: 'root' })
export class BonCommandeService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.STOCKS}/commandes`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<BonCommande[]> { return this.httpClient.get<BonCommande[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<BonCommande> { return this.httpClient.get<BonCommande>(`${this.SERVICE_URL}/${id}`) }
    create(item: BonCommande): Observable<BonCommande> { return this.httpClient.post<BonCommande>(`${this.SERVICE_URL}`, item) }
    update(item: BonCommande): Observable<BonCommande> { return this.httpClient.put<BonCommande>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
