import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SortieProvisoire } from '../models/SortieProvisoire.model';

@Injectable({ providedIn: 'root' })
export class SortieProvisoireService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.IMMOBILISATIONS}/sorties-provisoires`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<SortieProvisoire[]> { return this.httpClient.get<SortieProvisoire[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<SortieProvisoire> { return this.httpClient.get<SortieProvisoire>(`${this.SERVICE_URL}/${id}`) }
    create(item: SortieProvisoire): Observable<SortieProvisoire> { return this.httpClient.post<SortieProvisoire>(`${this.SERVICE_URL}`, item) }
    update(item: SortieProvisoire): Observable<SortieProvisoire> { return this.httpClient.put<SortieProvisoire>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
