import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LigneBulletin } from '../models/LigneBulletin.model';

@Injectable({ providedIn: 'root' })
export class RhLigneBulletinService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.RH}/lignes-bulletin`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<LigneBulletin[]> { return this.httpClient.get<LigneBulletin[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<LigneBulletin> { return this.httpClient.get<LigneBulletin>(`${this.SERVICE_URL}/${id}`) }
    create(item: LigneBulletin): Observable<LigneBulletin> { return this.httpClient.post<LigneBulletin>(`${this.SERVICE_URL}`, item) }
    update(item: LigneBulletin): Observable<LigneBulletin> { return this.httpClient.put<LigneBulletin>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
