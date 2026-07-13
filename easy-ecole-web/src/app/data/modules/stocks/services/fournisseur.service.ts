import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Fournisseur } from '../models/Fournisseur.model';

@Injectable({ providedIn: 'root' })
export class FournisseurService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.STOCKS}/fournisseurs`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<Fournisseur[]> { return this.httpClient.get<Fournisseur[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<Fournisseur> { return this.httpClient.get<Fournisseur>(`${this.SERVICE_URL}/${id}`) }
    create(item: Fournisseur): Observable<Fournisseur> { return this.httpClient.post<Fournisseur>(`${this.SERVICE_URL}`, item) }
    update(item: Fournisseur): Observable<Fournisseur> { return this.httpClient.put<Fournisseur>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
