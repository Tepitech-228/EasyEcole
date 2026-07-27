import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PeriodePaie } from '../models/PeriodePaie.model';

@Injectable({ providedIn: 'root' })
export class RhPeriodePaieService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.RH}/periodes-paie`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<PeriodePaie[]> { return this.httpClient.get<PeriodePaie[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<PeriodePaie> { return this.httpClient.get<PeriodePaie>(`${this.SERVICE_URL}/${id}`) }
    create(item: any): Observable<PeriodePaie> { return this.httpClient.post<PeriodePaie>(`${this.SERVICE_URL}`, item) }
    update(item: any): Observable<PeriodePaie> { return this.httpClient.put<PeriodePaie>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
    genererBulletins(id: string): Observable<any> { return this.httpClient.post(`${this.SERVICE_URL}/${id}/generer`, {}) }
}
