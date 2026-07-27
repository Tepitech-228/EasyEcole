import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HeureSupplementaire } from '../models/HeureSupplementaire.model';

@Injectable({ providedIn: 'root' })
export class RhHeureSupplementaireService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.RH}/heures-supplementaires`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<HeureSupplementaire[]> { return this.httpClient.get<HeureSupplementaire[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<HeureSupplementaire> { return this.httpClient.get<HeureSupplementaire>(`${this.SERVICE_URL}/${id}`) }
    create(item: HeureSupplementaire): Observable<HeureSupplementaire> { return this.httpClient.post<HeureSupplementaire>(`${this.SERVICE_URL}`, item) }
    update(item: HeureSupplementaire): Observable<HeureSupplementaire> { return this.httpClient.put<HeureSupplementaire>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
