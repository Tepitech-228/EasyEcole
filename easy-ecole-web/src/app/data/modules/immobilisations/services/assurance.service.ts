import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AssuranceImmobilisation } from '../models/AssuranceImmobilisation.model';

@Injectable({ providedIn: 'root' })
export class AssuranceService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.IMMOBILISATIONS}/assurances`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<AssuranceImmobilisation[]> { return this.httpClient.get<AssuranceImmobilisation[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<AssuranceImmobilisation> { return this.httpClient.get<AssuranceImmobilisation>(`${this.SERVICE_URL}/${id}`) }
    create(item: AssuranceImmobilisation): Observable<AssuranceImmobilisation> { return this.httpClient.post<AssuranceImmobilisation>(`${this.SERVICE_URL}`, item) }
    update(item: AssuranceImmobilisation): Observable<AssuranceImmobilisation> { return this.httpClient.put<AssuranceImmobilisation>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
