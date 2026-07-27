import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RemboursementPret } from '../models/RemboursementPret.model';

@Injectable({ providedIn: 'root' })
export class RhRemboursementPretService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.RH}/remboursements-prets`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<RemboursementPret[]> { return this.httpClient.get<RemboursementPret[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<RemboursementPret> { return this.httpClient.get<RemboursementPret>(`${this.SERVICE_URL}/${id}`) }
    create(item: RemboursementPret): Observable<RemboursementPret> { return this.httpClient.post<RemboursementPret>(`${this.SERVICE_URL}`, item) }
    update(item: RemboursementPret): Observable<RemboursementPret> { return this.httpClient.put<RemboursementPret>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
