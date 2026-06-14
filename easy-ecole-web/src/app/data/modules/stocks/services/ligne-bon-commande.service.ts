import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LigneBonCommande } from '../models/LigneBonCommande.model';

@Injectable({ providedIn: 'root' })
export class LigneBonCommandeService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.STOCKS}/lignes-commande`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<LigneBonCommande[]> { return this.httpClient.get<LigneBonCommande[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<LigneBonCommande> { return this.httpClient.get<LigneBonCommande>(`${this.SERVICE_URL}/${id}`) }
    create(item: LigneBonCommande): Observable<LigneBonCommande> { return this.httpClient.post<LigneBonCommande>(`${this.SERVICE_URL}`, item) }
    update(item: LigneBonCommande): Observable<LigneBonCommande> { return this.httpClient.put<LigneBonCommande>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
