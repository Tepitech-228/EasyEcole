import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PretEmploye } from '../models/PretEmploye.model';

@Injectable({ providedIn: 'root' })
export class RhPretService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.RH}/prets`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<PretEmploye[]> { return this.httpClient.get<PretEmploye[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<PretEmploye> { return this.httpClient.get<PretEmploye>(`${this.SERVICE_URL}/${id}`) }
    create(item: PretEmploye): Observable<PretEmploye> { return this.httpClient.post<PretEmploye>(`${this.SERVICE_URL}`, item) }
    update(item: PretEmploye): Observable<PretEmploye> { return this.httpClient.put<PretEmploye>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
