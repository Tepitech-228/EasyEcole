import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Besoin } from '../models/Besoin.model';

@Injectable({ providedIn: 'root' })
export class BesoinService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.STOCKS}/besoins`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<Besoin[]> { return this.httpClient.get<Besoin[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<Besoin> { return this.httpClient.get<Besoin>(`${this.SERVICE_URL}/${id}`) }
    create(item: Besoin): Observable<Besoin> { return this.httpClient.post<Besoin>(`${this.SERVICE_URL}`, item) }
    update(item: Besoin): Observable<Besoin> { return this.httpClient.put<Besoin>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
